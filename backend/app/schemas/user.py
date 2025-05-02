from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    name: str
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None


class UserInDBBase(UserBase):
    id: UUID
    role: str
    created_at: datetime
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    """User data returned to clients"""

    pass


class UserInDB(UserInDBBase):
    """User data stored in DB"""

    hashed_password: str
