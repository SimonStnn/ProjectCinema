from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import User as UserSchema, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login_access_token(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Find the user by email
    result = await db.execute(select(User).filter(User.email == login_data.email))
    user = result.scalars().first()

    # Validate credentials
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Register a new user
    """
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password),
        role="user",
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user information
    """
    return current_user
