from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import schemas
from app.database import get_db
from app.deps import get_current_user
from app.models import Comment, User, Walk

router = APIRouter(tags=["comments"])


@router.get("/walks/{walk_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(walk_id: int, db: Session = Depends(get_db)):
    if not db.get(Walk, walk_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Прогулка не найдена")
    stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.walk_id == walk_id)
        .order_by(Comment.created_at)
    )
    return db.scalars(stmt).all()


@router.post(
    "/walks/{walk_id}/comments",
    response_model=schemas.CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    walk_id: int,
    data: schemas.CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Walk, walk_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Прогулка не найдена")
    comment = Comment(text=data.text.strip(), walk_id=walk_id, author_id=user.id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Комментарий не найден")
    if comment.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Можно удалять только свои комментарии")
    db.delete(comment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
