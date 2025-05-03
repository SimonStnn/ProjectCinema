from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.user import User
from app.models.movie import Movie
from app.models.showing import Showing
from app.models.room import Room
from app.models.booking import Booking

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/", response_model=dict)
async def admin_dashboard(current_user: User = Depends(get_current_admin_user)) -> Any:
    """
    Admin dashboard overview
    """
    return {"message": "Admin dashboard", "admin_name": current_user.name}


@router.get("/users", response_model=List[dict])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all users (admin only)
    """
    query = select(User).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return [
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


@router.get("/bookings", response_model=List[dict])
async def get_all_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all bookings (admin only)
    """
    query = select(Booking).offset(skip).limit(limit)
    result = await db.execute(query)
    bookings = result.scalars().all()

    return [
        {
            "id": str(booking.id),
            "user_id": str(booking.user_id),
            "showing_id": str(booking.showing_id),
            "booking_number": booking.booking_number,
            "status": booking.status,
            "total_price": booking.total_price,
            "created_at": booking.created_at,
        }
        for booking in bookings
    ]


@router.get("/showings", response_model=List[dict])
async def get_all_showings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all showings (admin only)
    """
    query = select(Showing).offset(skip).limit(limit)
    result = await db.execute(query)
    showings = result.scalars().all()

    return [
        {
            "id": str(showing.id),
            "movie_id": str(showing.movie_id),
            "room_id": str(showing.room_id),
            "start_time": showing.start_time,
            "end_time": showing.end_time,
            "price": showing.price,
            "status": showing.status,
        }
        for showing in showings
    ]


@router.post("/room", response_model=dict)
async def create_room(
    room_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Create a new room in the cinema (admin only)
    """
    # Placeholder implementation - would need proper implementation
    return {"message": "Room created successfully"}


@router.post("/showing", response_model=dict)
async def create_showing(
    showing_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Create a new showing (admin only)
    """
    # Placeholder implementation - would need proper implementation
    return {"message": "Showing created successfully"}
