from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import get_current_user, get_current_admin_user
from app.db.session import get_db
from app.models.cinema import Cinema
from app.models.room import Room
from app.models.user import User

router = APIRouter(prefix="/cinemas", tags=["cinemas"])


@router.get("/", response_model=List[dict])
async def get_cinemas(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get list of all cinemas
    """
    # Placeholder implementation - would need proper schemas
    query = select(Cinema)
    result = await db.execute(query)
    cinemas = result.scalars().all()

    return [
        {"id": str(cinema.id), "name": cinema.name, "city": cinema.city}
        for cinema in cinemas
    ]


@router.get("/{cinema_id}", response_model=dict)
async def get_cinema(cinema_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get details for a specific cinema
    """
    # Placeholder implementation - would need proper schemas
    result = await db.execute(select(Cinema).filter(Cinema.id == cinema_id))
    cinema = result.scalars().first()

    if not cinema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cinema not found"
        )

    return {
        "id": str(cinema.id),
        "name": cinema.name,
        "address": cinema.address,
        "city": cinema.city,
        "description": cinema.description,
    }


@router.get("/{cinema_id}/rooms", response_model=List[dict])
async def get_cinema_rooms(cinema_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get rooms for a specific cinema
    """
    # Check if cinema exists
    cinema_result = await db.execute(select(Cinema).filter(Cinema.id == cinema_id))
    cinema = cinema_result.scalars().first()

    if not cinema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cinema not found"
        )

    # Get rooms
    query = select(Room).filter(Room.cinema_id == cinema_id)
    result = await db.execute(query)
    rooms = result.scalars().all()

    return [
        {"id": str(room.id), "name": room.name, "capacity": room.capacity}
        for room in rooms
    ]
