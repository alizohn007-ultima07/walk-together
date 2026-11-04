from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    exists = db.scalar(
        select(User).where(or_(User.email == email, User.username == data.username))
    )
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пользователь с таким логином или email уже существует")
    user = User(
        username=data.username,
        email=email,
        password_hash=hash_password(data.password),
        city=data.city,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    key = data.login.strip()
    user = db.scalar(select(User).where(or_(User.email == key.lower(), User.username == key)))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный логин или пароль")
    return schemas.Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    return user
