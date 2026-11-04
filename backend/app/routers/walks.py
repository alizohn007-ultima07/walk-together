from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app import schemas
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models import Participant, User, Walk

router = APIRouter(prefix="/walks", tags=["walks"])


def ensure_tz(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def walk_to_out(walk: Walk, user: User | None) -> schemas.WalkOut:
    return schemas.WalkOut(
        id=walk.id,
        title=walk.title,
        description=walk.description,
        category=walk.category,
        city=walk.city,
        address=walk.address,
        latitude=walk.latitude,
        longitude=walk.longitude,
        start_time=walk.start_time,
        max_participants=walk.max_participants,
        organizer=schemas.UserShort.model_validate(walk.organizer),
        participants_count=len(walk.participants),
        is_joined=bool(user and any(p.user_id == user.id for p in walk.participants)),
        created_at=walk.created_at,
    )


def base_query():
    return select(Walk).options(selectinload(Walk.organizer), selectinload(Walk.participants))


def get_walk_or_404(db: Session, walk_id: int) -> Walk:
    walk = db.scalar(base_query().where(Walk.id == walk_id))
    if not walk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Прогулка не найдена")
    return walk


@router.get("", response_model=list[schemas.WalkOut])
def list_walks(
    q: str | None = None,
    city: str | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    organizer_id: int | None = None,
    include_past: bool = False,
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    stmt = base_query()
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Walk.title.ilike(like), Walk.description.ilike(like)))
    if city:
        stmt = stmt.where(Walk.city.ilike(f"%{city}%"))
    if category:
        stmt = stmt.where(Walk.category == category)
    if organizer_id:
        stmt = stmt.where(Walk.organizer_id == organizer_id)
    if date_from:
        stmt = stmt.where(Walk.start_time >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
    if date_to:
        stmt = stmt.where(Walk.start_time <= datetime.combine(date_to, time.max, tzinfo=timezone.utc))
    if not include_past:
        stmt = stmt.where(Walk.start_time >= datetime.now(timezone.utc))
    stmt = stmt.order_by(Walk.start_time.asc()).limit(limit)
    return [walk_to_out(w, user) for w in db.scalars(stmt).all()]


@router.get("/my/organized", response_model=list[schemas.WalkOut])
def my_organized(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = base_query().where(Walk.organizer_id == user.id).order_by(Walk.start_time.desc())
    return [walk_to_out(w, user) for w in db.scalars(stmt).all()]


@router.get("/my/joined", response_model=list[schemas.WalkOut])
def my_joined(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        base_query()
        .join(Participant, Participant.walk_id == Walk.id)
        .where(Participant.user_id == user.id)
        .order_by(Walk.start_time.desc())
    )
    return [walk_to_out(w, user) for w in db.scalars(stmt).all()]


@router.post("", response_model=schemas.WalkOut, status_code=status.HTTP_201_CREATED)
def create_walk(
    data: schemas.WalkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payload = data.model_dump()
    payload["start_time"] = ensure_tz(data.start_time)
    if payload["start_time"] < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Время прогулки должно быть в будущем")
    walk = Walk(**payload, organizer_id=user.id)
    db.add(walk)
    db.commit()
    return walk_to_out(get_walk_or_404(db, walk.id), user)


@router.get("/{walk_id}", response_model=schemas.WalkOut)
def get_walk(
    walk_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    return walk_to_out(get_walk_or_404(db, walk_id), user)


@router.put("/{walk_id}", response_model=schemas.WalkOut)
def update_walk(
    walk_id: int,
    data: schemas.WalkUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    walk = get_walk_or_404(db, walk_id)
    if walk.organizer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Редактировать можно только свои прогулки")
    changes = data.model_dump(exclude_unset=True)
    if "start_time" in changes and changes["start_time"] is not None:
        changes["start_time"] = ensure_tz(changes["start_time"])
    for key, value in changes.items():
        if value is not None:
            setattr(walk, key, value)
    if len(walk.participants) > walk.max_participants:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Лимит меньше, чем уже записалось участников")
    db.commit()
    return walk_to_out(get_walk_or_404(db, walk_id), user)


@router.delete("/{walk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_walk(
    walk_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    walk = get_walk_or_404(db, walk_id)
    if walk.organizer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Удалять можно только свои прогулки")
    db.delete(walk)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{walk_id}/participants", response_model=list[schemas.UserShort])
def participants(walk_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(User)
        .join(Participant, Participant.user_id == User.id)
        .where(Participant.walk_id == walk_id)
        .order_by(Participant.joined_at)
    )
    return db.scalars(stmt).all()


@router.post("/{walk_id}/join", response_model=schemas.WalkOut)
def join_walk(
    walk_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    walk = get_walk_or_404(db, walk_id)
    if walk.organizer_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Вы организатор этой прогулки")
    if ensure_tz(walk.start_time) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Прогулка уже прошла")
    if any(p.user_id == user.id for p in walk.participants):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Вы уже записаны")
    if len(walk.participants) >= walk.max_participants:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Мест больше нет")
    db.add(Participant(walk_id=walk.id, user_id=user.id))
    db.commit()
    return walk_to_out(get_walk_or_404(db, walk_id), user)


@router.delete("/{walk_id}/join", response_model=schemas.WalkOut)
def leave_walk(
    walk_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    walk = get_walk_or_404(db, walk_id)
    part = next((p for p in walk.participants if p.user_id == user.id), None)
    if not part:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Вы не записаны на эту прогулку")
    db.delete(part)
    db.commit()
    return walk_to_out(get_walk_or_404(db, walk_id), user)
