from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.core.security import get_current_user, get_current_admin_user
from app.db.session import get_db
from app.models.movie import Movie
from app.models.user import User
from app.schemas.movie import Movie as MovieSchema, MovieCreate, MovieDetail, TMDBMovie
from app.services.tmdb_service import tmdb_service

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/", response_model=List[MovieSchema])
async def get_movies(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
) -> Any:
    """
    Get list of movies in the database
    """
    query = select(Movie)

    # Apply search filter if provided
    if search:
        query = query.filter(
            or_(
                Movie.title.ilike(f"%{search}%"),
                Movie.genres.any(search, operator="@>"),
            )
        )

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    movies = result.scalars().all()

    return movies


@router.get("/now-playing", response_model=List[TMDBMovie])
async def get_now_playing_movies(
    page: int = Query(1, ge=1, le=1000),
) -> Any:
    """
    Get movies currently in theaters from TMDB
    """
    response = await tmdb_service.get_now_playing(page=page)
    return response.get("results", [])


@router.get("/upcoming", response_model=List[TMDBMovie])
async def get_upcoming_movies(
    page: int = Query(1, ge=1, le=1000),
) -> Any:
    """
    Get upcoming movies from TMDB
    """
    response = await tmdb_service.get_upcoming(page=page)
    return response.get("results", [])


@router.get("/popular", response_model=List[TMDBMovie])
async def get_popular_movies(
    page: int = Query(1, ge=1, le=1000),
) -> Any:
    """
    Get popular movies from TMDB
    """
    response = await tmdb_service.get_popular(page=page)
    return response.get("results", [])


@router.get("/search", response_model=List[TMDBMovie])
async def search_movies(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1, le=1000),
) -> Any:
    """
    Search for movies in TMDB
    """
    response = await tmdb_service.search_movies(query=query, page=page)
    return response.get("results", [])


@router.get("/{movie_id}", response_model=MovieDetail)
async def get_movie(
    movie_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get details for a specific movie
    """
    result = await db.execute(select(Movie).filter(Movie.id == movie_id))
    movie = result.scalars().first()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found",
        )

    return movie


@router.get("/tmdb/{tmdb_id}", response_model=TMDBMovie)
async def get_movie_from_tmdb(
    tmdb_id: int,
) -> Any:
    """
    Get a movie from TMDB by its ID
    """
    return await tmdb_service.get_movie(movie_id=tmdb_id)


@router.post("/", response_model=MovieSchema, status_code=status.HTTP_201_CREATED)
async def create_movie(
    movie_data: MovieCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Create a new movie (admin only)
    """
    # Check if movie with this TMDB ID already exists
    result = await db.execute(select(Movie).filter(Movie.tmdb_id == movie_data.tmdb_id))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie with this TMDB ID already exists",
        )

    # Create new movie
    movie = Movie(**movie_data.dict())
    db.add(movie)
    await db.commit()
    await db.refresh(movie)

    return movie


@router.post(
    "/import-from-tmdb/{tmdb_id}",
    response_model=MovieSchema,
    status_code=status.HTTP_201_CREATED,
)
async def import_movie_from_tmdb(
    tmdb_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    Import a movie from TMDB (admin only)
    """
    # Check if movie already exists
    result = await db.execute(select(Movie).filter(Movie.tmdb_id == tmdb_id))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie with this TMDB ID already exists",
        )

    # Fetch movie data from TMDB
    tmdb_movie = await tmdb_service.get_movie(movie_id=tmdb_id)

    # Create the movie in our database
    movie = Movie(
        tmdb_id=tmdb_movie.get("id"),
        title=tmdb_movie.get("title"),
        overview=tmdb_movie.get("overview"),
        poster_path=tmdb_movie.get("poster_path"),
        backdrop_path=tmdb_movie.get("backdrop_path"),
        release_date=tmdb_service.parse_release_date(tmdb_movie.get("release_date")),
        runtime=tmdb_movie.get("runtime"),
        genres=tmdb_service.extract_genre_names(tmdb_movie.get("genres", [])),
        vote_average=tmdb_movie.get("vote_average"),
        vote_count=tmdb_movie.get("vote_count"),
    )

    db.add(movie)
    await db.commit()
    await db.refresh(movie)

    return movie
