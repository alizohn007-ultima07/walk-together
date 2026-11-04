from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    city: str | None = Field(default=None, max_length=100)


class LoginIn(BaseModel):
    login: str  # email или username
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserShort(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: EmailStr
    city: str | None
    about: str | None
    created_at: datetime


class UserUpdate(BaseModel):
    city: str | None = Field(default=None, max_length=100)
    about: str | None = Field(default=None, max_length=2000)


class UserPublic(BaseModel):
    id: int
    username: str
    city: str | None
    about: str | None
    created_at: datetime
    walks_count: int
    followers_count: int
    is_subscribed: bool


class WalkBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=1, max_length=5000)
    category: str = Field(min_length=1, max_length=50)
    city: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start_time: datetime
    max_participants: int = Field(ge=1, le=200)


class WalkCreate(WalkBase):
    pass


class WalkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=150)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    start_time: datetime | None = None
    max_participants: int | None = Field(default=None, ge=1, le=200)


class WalkOut(WalkBase):
    id: int
    organizer: UserShort
    participants_count: int
    is_joined: bool
    created_at: datetime


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    walk_id: int
    author: UserShort
    created_at: datetime
