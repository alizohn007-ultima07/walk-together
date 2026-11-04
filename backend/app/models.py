from datetime import datetime

from sqlalchemy import (
    DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(100))
    about: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    walks: Mapped[list["Walk"]] = relationship(back_populates="organizer", cascade="all, delete-orphan")


class Walk(Base):
    __tablename__ = "walks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), index=True)
    city: Mapped[str] = mapped_column(String(100), index=True)
    address: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    max_participants: Mapped[int] = mapped_column(Integer)
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organizer: Mapped[User] = relationship(back_populates="walks")
    participants: Mapped[list["Participant"]] = relationship(
        back_populates="walk", cascade="all, delete-orphan"
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="walk", cascade="all, delete-orphan", order_by="Comment.created_at"
    )


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (UniqueConstraint("walk_id", "user_id", name="uq_participant_walk_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    walk_id: Mapped[int] = mapped_column(ForeignKey("walks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    walk: Mapped[Walk] = relationship(back_populates="participants")
    user: Mapped[User] = relationship()


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str] = mapped_column(Text)
    walk_id: Mapped[int] = mapped_column(ForeignKey("walks.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    walk: Mapped[Walk] = relationship(back_populates="comments")
    author: Mapped[User] = relationship()


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("follower_id", "organizer_id", name="uq_subscription"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
