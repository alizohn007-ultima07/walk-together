from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models import Subscription, User, Walk

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.city = data.city
    user.about = data.about
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/subscriptions", response_model=list[schemas.UserShort])
def my_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(User)
        .join(Subscription, Subscription.organizer_id == User.id)
        .where(Subscription.follower_id == user.id)
        .order_by(User.username)
    )
    return db.scalars(stmt).all()


@router.get("/{user_id}", response_model=schemas.UserPublic)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    walks_count = db.scalar(select(func.count()).select_from(Walk).where(Walk.organizer_id == user_id))
    followers = db.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.organizer_id == user_id)
    )
    subscribed = False
    if current:
        subscribed = db.scalar(
            select(Subscription.id).where(
                Subscription.follower_id == current.id, Subscription.organizer_id == user_id
            )
        ) is not None
    return schemas.UserPublic(
        id=target.id,
        username=target.username,
        city=target.city,
        about=target.about,
        created_at=target.created_at,
        walks_count=walks_count or 0,
        followers_count=followers or 0,
        is_subscribed=subscribed,
    )


@router.post("/{user_id}/subscribe", status_code=status.HTTP_204_NO_CONTENT)
def subscribe(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нельзя подписаться на себя")
    if not db.get(User, user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    exists = db.scalar(
        select(Subscription.id).where(
            Subscription.follower_id == user.id, Subscription.organizer_id == user_id
        )
    )
    if exists is None:
        db.add(Subscription(follower_id=user.id, organizer_id=user_id))
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{user_id}/subscribe", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.scalar(
        select(Subscription).where(
            Subscription.follower_id == user.id, Subscription.organizer_id == user_id
        )
    )
    if sub:
        db.delete(sub)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
