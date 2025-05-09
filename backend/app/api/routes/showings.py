from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from app.core.security import get_current_user, validate_admin
from app.db.session import get_db
from app.models.showing import Showing
from app.models.room import Room
from app.models.movie import Movie
from app.models.user import User
from app.core.config import settings

import tmdbsimple as tmdb

tmdb.API_KEY = settings.TMDB_API_KEY

router = APIRouter(prefix="/showings", tags=["showings"])


@router.get("/", response_model=List[dict])
async def get_showing(
    movie_id: int = Query(
        ..., title="Movie ID", description="TMDB ID of the movie to get showings for"
    ),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all showings for a specific movie by its TMDB ID
    """
    # First get the movie from our database using the TMDB ID
    result = await db.execute(select(Movie).filter(Movie.tmdb_id == movie_id))
    movie = result.scalars().first()

    if not movie:
        # Check if movie exists in TMDB
        try:
            # Verify movie exists in TMDB
            collection = tmdb.Movies(movie_id)
            tmdb_movie = collection.info()
            if not tmdb_movie:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Movie not found in TMDB",
                )
            # Movie exists in TMDB but not in our database, return empty list
            return []
        except Exception as e:
            # If there's any error with TMDB API, return empty list
            # This is more user-friendly than returning an error
            return []

    # Query showings with joined information about rooms
    query = (
        select(
            Showing.id,
            Showing.movie_id,
            Showing.start_time,
            Showing.end_time,
            Showing.price,
            Showing.status,
            Room.id.label("room_id"),
            Room.name.label("room_name"),
        )
        .select_from(Showing)
        .join(Room, Showing.room_id == Room.id)
        .filter(Showing.movie_id == movie.id)
        .filter(Showing.status == "scheduled")
    )

    result = await db.execute(query)
    showings = result.all()

    # Convert to list of dictionaries
    showings_list = [
        {
            "id": str(showing.id),
            "movie_id": int(movie_id),  # Use TMDB ID for frontend consistency
            "room_id": str(showing.room_id),
            "room_name": showing.room_name,
            "start_time": showing.start_time.isoformat(),
            "end_time": showing.end_time.isoformat(),
            "price": float(showing.price),
        }
        for showing in showings
    ]

    return showings_list


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


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_showing(
    movie_id: int = Body(..., description="TMDB Movie ID"),
    room_id: UUID = Body(..., description="Room ID"),
    start_time: datetime = Body(..., description="Start time of the showing"),
    end_time: datetime = Body(..., description="End time of the showing"),
    price: float = Body(..., description="Ticket price"),
    showing_status: str = Body("scheduled", description="Status of the showing"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new showing for a movie
    Only administrators can create showings
    """
    # Check if user is an admin
    validate_admin(current_user)

    # Verify that the movie exists using tmdb_id instead of id
    movie_result = await db.execute(select(Movie).filter(Movie.tmdb_id == movie_id))
    movie = movie_result.scalars().first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found"
        )

    # Verify that the room exists
    room_result = await db.execute(select(Room).filter(Room.id == room_id))
    room = room_result.scalars().first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    # Check for time conflicts in the same room
    conflict_query = (
        select(Showing)
        .filter(Showing.room_id == room_id)
        .filter(Showing.status == "scheduled")
        .filter(
            # Check for overlapping times
            ((Showing.start_time <= start_time) & (Showing.end_time > start_time))
            | ((Showing.start_time < end_time) & (Showing.end_time >= end_time))
            | ((Showing.start_time >= start_time) & (Showing.end_time <= end_time))
        )
    )

    conflict_result = await db.execute(conflict_query)
    conflicting_showing = conflict_result.scalars().first()

    if conflicting_showing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is a time conflict with another showing in this room",
        )

    # Create the new showing using the movie's internal ID
    new_showing = Showing(
        movie_id=movie.id,  # Use the UUID from the movie object
        room_id=room_id,
        start_time=start_time,
        end_time=end_time,
        price=price,
        status=showing_status,
    )

    db.add(new_showing)
    await db.commit()
    await db.refresh(new_showing)

    return {
        "id": str(new_showing.id),
        "movie_id": movie_id,  # Return the TMDB ID for frontend consistency
        "room_id": str(room_id),
        "start_time": new_showing.start_time.isoformat(),
        "end_time": new_showing.end_time.isoformat(),
        "price": float(new_showing.price),
        "status": showing_status,
    }
