from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.showing import Showing
from app.models.room import Room
from app.models.movie import Movie
from app.models.user import User

router = APIRouter(prefix="/showings", tags=["showings"])


@router.get("/", response_model=dict)
async def get_showing(
    movie_id: int = Query(
        ..., title="Movie ID", description="ID of the movie to get showings for"
    ),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get details for a specific showing
    """
    # Query to get the movie details
    query = (
        select(Movie)
        .filter(Movie.id == movie_id)
        .options(
            joinedload(Movie.genres),
            joinedload(Movie.director),
            # Movie.cast,  # Removed as it is not a valid argument for joinedload
        )
    )

    result = await db.execute(query)
    movie = result.scalars().first()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found",
        )

    # Get showings for the movie
    showings = await db.execute(select(Showing).filter(Showing.movie_id == movie_id))
    showings = showings.scalars().all()

    return {
        "movie": movie,
        "showings": showings,
    }


@router.get("/seats/{showing_id}", response_model=List[dict])
async def get_showing_seats(
    showing_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all seats and their status for a specific showing
    """
    # First, verify the showing exists
    result = await db.execute(select(Showing).filter(Showing.id == showing_id))
    showing = result.scalars().first()

    if not showing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Showing not found",
        )

    # Query to get all seats for the room with their booked status
    query = (
        select(
            Room.id.label("room_id"),
            Room.name.label("room_name"),
        )
        .select_from(Showing)
        .join(Room, Showing.room_id == Room.id)
        .filter(Showing.id == showing_id)
    )

    result = await db.execute(query)
    room_data = result.first()

    if not room_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room information not found",
        )

    # In a real implementation, you would get the actual seats and their status
    # This is a placeholder implementation that returns mock data
    # You would need to query the seats table and join with reservations

    rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
    seats_per_row = 12
    seats = []

    for row in rows:
        for number in range(1, seats_per_row + 1):
            is_accessible = row == "H" and number in [1, 2]
            status = "available"

            # Mock some booked/reserved seats for demonstration
            if (row == "D" and number in [6, 7]) or (row == "E" and number in [6, 7]):
                status = "booked"

            seats.append(
                {
                    "id": f"{row}{number}",
                    "row": row,
                    "number": number,
                    "status": status,
                    "isAccessible": is_accessible,
                    "price": (
                        15.0 if is_accessible else 12.0
                    ),  # Different pricing for accessible seats
                }
            )

    return seats
