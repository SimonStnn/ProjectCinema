from typing import Any, List
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.core.security import get_current_manager_user
from app.db.session import get_db
from app.models.user import User
from app.models.movie import Movie
from app.models.showing import Showing
from app.models.room import Room
from app.models.booking import Booking

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/", response_model=dict)
async def admin_dashboard(
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Admin dashboard overview
    """
    return {"message": "Admin dashboard", "admin_name": current_user.name}


@router.get("/users", response_model=List[dict])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
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
    current_user: User = Depends(get_current_manager_user),
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
    current_user: User = Depends(get_current_manager_user),
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
    current_user: User = Depends(get_current_manager_user),
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
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Create a new showing (admin only)
    """
    # Placeholder implementation - would need proper implementation
    return {"message": "Showing created successfully"}


@router.get("/dashboard/recent-bookings", response_model=List[dict])
async def get_recent_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
    limit: int = 10,
) -> Any:
    """
    Get recent bookings for the admin dashboard
    """
    query = select(Booking).order_by(desc(Booking.created_at)).limit(limit)
    result = await db.execute(query)
    bookings = result.scalars().all()

    # Join with related data for more complete information
    booking_data = []
    for booking in bookings:
        # Get showing information
        showing_query = select(Showing).where(Showing.id == booking.showing_id)
        showing_result = await db.execute(showing_query)
        showing = showing_result.scalar_one_or_none()

        # Get user information
        user_query = select(User).where(User.id == booking.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        # Get movie information if showing exists
        movie_data = None
        if showing:
            movie_query = select(Movie).where(Movie.id == showing.movie_id)
            movie_result = await db.execute(movie_query)
            movie = movie_result.scalar_one_or_none()
            if movie:
                movie_data = {"id": str(movie.id), "title": movie.title}

        booking_data.append(
            {
                "id": str(booking.id),
                "booking_number": booking.booking_number,
                "user": (
                    {"id": str(user.id), "name": user.name, "email": user.email}
                    if user
                    else None
                ),
                "showing": (
                    {
                        "id": str(showing.id),
                        "start_time": showing.start_time,
                        "movie": movie_data,
                    }
                    if showing
                    else None
                ),
                "status": booking.status,
                "total_price": booking.total_price,
                "created_at": booking.created_at,
            }
        )

    return booking_data


@router.get("/dashboard/stats", response_model=dict)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Get statistics for the admin dashboard
    """
    # Get total users count
    users_query = select(User)
    users_result = await db.execute(users_query)
    total_users = len(users_result.scalars().all())

    # Get total bookings count
    bookings_query = select(Booking)
    bookings_result = await db.execute(bookings_query)
    bookings = bookings_result.scalars().all()
    total_bookings = len(bookings)

    # Calculate total revenue
    total_revenue = sum(
        booking.total_price for booking in bookings if booking.total_price
    )

    # Get total movies count
    movies_query = select(Movie)
    movies_result = await db.execute(movies_query)
    total_movies = len(movies_result.scalars().all())

    # Get total showings count
    showings_query = select(Showing)
    showings_result = await db.execute(showings_query)
    total_showings = len(showings_result.scalars().all())

    # Get upcoming showings (future showings)
    from datetime import datetime

    now = datetime.now()
    upcoming_showings_query = select(Showing).where(Showing.start_time > now)
    upcoming_showings_result = await db.execute(upcoming_showings_query)
    total_upcoming_showings = len(upcoming_showings_result.scalars().all())

    # Get total rooms count
    rooms_query = select(Room)
    rooms_result = await db.execute(rooms_query)
    total_rooms = len(rooms_result.scalars().all())

    # Get recent bookings (last 7 days)
    from datetime import timedelta

    week_ago = now - timedelta(days=7)
    recent_bookings_query = select(Booking).where(Booking.created_at > week_ago)
    recent_bookings_result = await db.execute(recent_bookings_query)
    recent_bookings_count = len(recent_bookings_result.scalars().all())

    # Calculate revenue from last 7 days
    recent_revenue = sum(
        booking.total_price
        for booking in recent_bookings_result.scalars().all()
        if booking.total_price
    )

    return {
        "total_users": total_users,
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue),
        "total_movies": total_movies,
        "total_showings": total_showings,
        "upcoming_showings": total_upcoming_showings,
        "total_rooms": total_rooms,
        "recent_bookings": recent_bookings_count,
        "recent_revenue": float(recent_revenue),
        "last_updated": now.isoformat(),
    }


@router.get("/movies", response_model=List[dict])
async def get_admin_movies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
    q: str = "",
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all movies with optional filtering (admin only)
    """
    query = select(Movie)

    # Apply search filter if query parameter is provided
    if q:
        # Case-insensitive search on title or overview
        query = query.filter(
            (Movie.title.ilike(f"%{q}%")) | (Movie.overview.ilike(f"%{q}%"))
        )

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    movies = result.scalars().all()

    return [
        {
            "id": str(movie.id),
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "overview": movie.overview,
            "poster_path": movie.poster_path,
            "backdrop_path": movie.backdrop_path,
            "release_date": (
                movie.release_date.isoformat() if movie.release_date else None
            ),
            "runtime": movie.runtime,
            "status": movie.status,
            "vote_average": movie.vote_average,
            "genres": movie.genres or [],
            "director": movie.director or "",
            "cast": movie.cast or [],
            "trailer_url": movie.trailer_url,
            "created_at": movie.created_at.isoformat() if movie.created_at else None,
            "updated_at": movie.updated_at.isoformat() if movie.updated_at else None,
        }
        for movie in movies
    ]


@router.delete("/movies/{movie_id}", response_model=dict)
async def delete_movie(
    movie_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Delete a movie (admin only)
    """
    # Check if movie exists
    movie_query = select(Movie).where(Movie.id == movie_id)
    result = await db.execute(movie_query)
    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found"
        )

    # Check if movie is used in any showings
    showing_query = select(Showing).where(Showing.movie_id == movie_id)
    showing_result = await db.execute(showing_query)
    showings = showing_result.scalars().all()

    if showings:
        # Option 1: Prevent deletion if movie has showings
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete movie that has showings scheduled",
        )

        # Option 2 (alternative): Cascade delete all showings
        # for showing in showings:
        #     await db.delete(showing)

    # Delete the movie
    await db.delete(movie)
    await db.commit()

    return {"message": "Movie deleted successfully"}


@router.get("/tmdb/search", response_model=dict)
async def search_tmdb_movies(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Search for movies in TMDB API
    """
    try:
        import requests
        from app.core.config import settings

        # TMDB API endpoint
        url = f"https://api.themoviedb.org/3/search/movie"

        # Parameters
        params = {
            "api_key": settings.TMDB_API_KEY,
            "query": query,
            "language": "en-US",
            "page": 1,
            "include_adult": "false",
        }

        # Make request to TMDB
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise exception for non-200 status codes

        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching TMDB: {str(e)}",
        )


@router.post("/tmdb/import/{tmdb_id}", response_model=dict)
async def import_movie_from_tmdb(
    tmdb_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Import a movie from TMDB API by its ID
    """
    try:
        import requests
        from app.core.config import settings
        from datetime import datetime

        # Check if movie already exists with this TMDB ID
        query = select(Movie).where(Movie.tmdb_id == tmdb_id)
        result = await db.execute(query)
        existing_movie = result.scalar_one_or_none()

        if existing_movie:
            return {
                "message": "Movie already exists in database",
                "movie_id": str(existing_movie.id),
            }

        # TMDB API endpoint for movie details
        url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"

        # Parameters
        params = {
            "api_key": settings.TMDB_API_KEY,
            "language": "en-US",
            "append_to_response": "credits,videos",
        }

        # Make request to TMDB
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise exception for non-200 status codes

        movie_data = response.json()

        # Extract director
        director = ""
        if "credits" in movie_data and "crew" in movie_data["credits"]:
            directors = [
                crew
                for crew in movie_data["credits"]["crew"]
                if crew["job"] == "Director"
            ]
            if directors:
                director = directors[0]["name"]

        # Extract cast
        cast = []
        if "credits" in movie_data and "cast" in movie_data["credits"]:
            cast = [
                actor["name"] for actor in movie_data["credits"]["cast"][:10]
            ]  # Get top 10 cast members

        # Extract trailer
        trailer_url = None
        if "videos" in movie_data and "results" in movie_data["videos"]:
            trailers = [
                video
                for video in movie_data["videos"]["results"]
                if video["type"] == "Trailer" and video["site"] == "YouTube"
            ]
            if trailers:
                trailer_url = f"https://www.youtube.com/watch?v={trailers[0]['key']}"

        # Extract genres
        genres = []
        if "genres" in movie_data:
            genres = [genre["name"] for genre in movie_data["genres"]]

        # Parse release date
        release_date = None
        if movie_data.get("release_date"):
            try:
                release_date = datetime.strptime(
                    movie_data["release_date"], "%Y-%m-%d"
                ).date()
            except:
                pass

        # Create new movie object
        new_movie = Movie(
            tmdb_id=tmdb_id,
            title=movie_data["title"],
            overview=movie_data["overview"],
            poster_path=movie_data.get("poster_path"),
            backdrop_path=movie_data.get("backdrop_path"),
            release_date=release_date,
            runtime=movie_data.get("runtime", 0),
            status=movie_data.get("status", "Released"),
            vote_average=movie_data.get("vote_average", 0.0),
            genres=genres,
            director=director,
            cast=cast,
            trailer_url=trailer_url,
        )

        db.add(new_movie)
        await db.commit()
        await db.refresh(new_movie)

        return {"message": "Movie imported successfully", "movie_id": str(new_movie.id)}

    except Exception as e:
        # Rollback in case of error
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing movie from TMDB: {str(e)}",
        )


@router.get("/settings", response_model=dict)
async def get_admin_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Get system settings (admin only)
    """
    # In a real application, these would be stored in a database table
    # For this implementation, we'll return hardcoded default settings

    settings = {
        "general": {
            "site_name": "Project Cinema",
            "contact_email": "admin@projectcinema.com",
            "support_phone": "+1 (555) 123-4567",
            "maintenance_mode": False,
        },
        "booking": {
            "max_seats_per_booking": 10,
            "reservation_timeout_minutes": 15,
            "show_sold_out": True,
            "allow_cancel_minutes_before": 120,  # 2 hours
            "booking_fee_percentage": 5.0,
        },
        "payment": {
            "currency": "USD",
            "payment_methods": ["credit_card", "paypal"],
            "tax_rate_percentage": 7.5,
        },
        "notification": {
            "email_notifications": True,
            "sms_notifications": False,
            "send_booking_confirmations": True,
            "send_reminder_hours_before": 24,
        },
        "appearance": {
            "primary_color": "#3f51b5",
            "secondary_color": "#f50057",
            "logo_url": "/images/logo.png",
            "favicon_url": "/favicon.ico",
        },
    }

    return settings


@router.post("/settings", response_model=dict)
async def update_admin_settings(
    settings_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Update system settings (admin only)
    """
    # In a real application, these settings would be saved to a database
    # For this implementation, we'll just return success message

    # Validate settings data structure (minimal validation)
    required_categories = [
        "general",
        "booking",
        "payment",
        "notification",
        "appearance",
    ]
    for category in required_categories:
        if category not in settings_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required settings category: {category}",
            )

    # Log the update for demonstration purposes
    print(f"Settings updated by admin {current_user.name}:", settings_data)

    return {
        "message": "Settings updated successfully",
        "updated_at": datetime.now().isoformat(),
    }


@router.get("/cinemas", response_model=List[dict])
async def get_admin_cinemas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Get cinema information for admin dashboard
    Since we only have one cinema, this returns a list with a single item for consistency
    """
    # Return static information about the single cinema in list format for frontend compatibility
    return [
        {
            "id": "1",  # Using a fixed ID since there's only one cinema
            "name": "Grand Cinema",
            "address": "123 Main Street",
            "city": "Movie City",
            "description": "The best cinema experience in town",
            "phone": "555-123-4567",
            "email": "info@grandcinema.com",
        }
    ]


@router.get("/cinemas/{cinema_id}/rooms", response_model=List[dict])
async def get_admin_cinema_rooms(
    cinema_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user),
) -> Any:
    """
    Get rooms for a specific cinema (admin only)
    """
    # Fetch all rooms since there's only one cinema
    query = select(Room)
    result = await db.execute(query)
    rooms = result.scalars().all()

    return [
        {
            "id": str(room.id),
            "name": room.name,
            "cinema_id": cinema_id,  # Use the provided cinema_id for consistency
            "seat_count": room.capacity,
        }
        for room in rooms
    ]
