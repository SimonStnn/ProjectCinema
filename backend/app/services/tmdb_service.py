import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

import httpx
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class TMDBService:
    """Service for interacting with The Movie Database (TMDB) API"""

    def __init__(
        self, api_key: str = settings.TMDB_API_KEY, api_url: str = settings.TMDB_API_BASE_URL
    ):
        self.api_key = api_key
        self.api_url = api_url
        self.headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    async def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make a request to the TMDB API"""
        if not self.api_key:
            raise HTTPException(status_code=500, detail="TMDB API key not configured")

        url = f"{self.api_url}{endpoint}"
        default_params = {"language": "en-US"}
        if params:
            default_params.update(params)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url, params=default_params, headers=self.headers, timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(
                f"TMDB API error: {e.response.status_code} - {e.response.text}"
            )
            raise HTTPException(
                status_code=502, detail=f"Error from TMDB API: {e.response.status_code}"
            )
        except httpx.RequestError as e:
            logger.error(f"TMDB API request failed: {str(e)}")
            raise HTTPException(status_code=503, detail="Could not connect to TMDB API")

    async def get_now_playing_movies(self, page: int = 1) -> Dict[str, Any]:
        """Get movies that are currently playing in theaters"""
        return await self._make_request("/movie/now_playing", {"page": page})

    async def get_popular_movies(self, page: int = 1) -> Dict[str, Any]:
        """Get a list of popular movies"""
        return await self._make_request("/movie/popular", {"page": page})

    async def get_upcoming_movies(self, page: int = 1) -> Dict[str, Any]:
        """Get a list of upcoming movies"""
        return await self._make_request("/movie/upcoming", {"page": page})

    async def get_movie_details(self, movie_id: int) -> Dict[str, Any]:
        """Get detailed information about a specific movie"""
        return await self._make_request(
            f"/movie/{movie_id}", {"append_to_response": "videos,credits,images"}
        )

    async def search_movies(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Search for movies by title"""
        return await self._make_request("/search/movie", {"query": query, "page": page})

    async def get_movie_recommendations(
        self, movie_id: int, page: int = 1
    ) -> Dict[str, Any]:
        """Get movie recommendations based on a specific movie"""
        return await self._make_request(
            f"/movie/{movie_id}/recommendations", {"page": page}
        )

    async def format_movie_data(self, movie_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format movie data for the frontend"""
        return {
            "id": movie_data.get("id"),
            "title": movie_data.get("title"),
            "overview": movie_data.get("overview"),
            "poster_path": (
                f"https://image.tmdb.org/t/p/w500{movie_data.get('poster_path')}"
                if movie_data.get("poster_path")
                else None
            ),
            "backdrop_path": (
                f"https://image.tmdb.org/t/p/original{movie_data.get('backdrop_path')}"
                if movie_data.get("backdrop_path")
                else None
            ),
            "release_date": movie_data.get("release_date"),
            "vote_average": movie_data.get("vote_average"),
            "genres": (
                [genre.get("name") for genre in movie_data.get("genres", [])]
                if "genres" in movie_data
                else None
            ),
            "runtime": movie_data.get("runtime"),
        }

    async def format_movie_list(
        self, movie_list_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Format a list of movies for the frontend"""
        formatted_results = []

        for movie in movie_list_data.get("results", []):
            formatted_results.append(
                {
                    "id": movie.get("id"),
                    "title": movie.get("title"),
                    "overview": movie.get("overview"),
                    "poster_path": (
                        f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}"
                        if movie.get("poster_path")
                        else None
                    ),
                    "release_date": movie.get("release_date"),
                    "vote_average": movie.get("vote_average"),
                }
            )

        return {
            "page": movie_list_data.get("page", 1),
            "total_pages": movie_list_data.get("total_pages", 1),
            "total_results": movie_list_data.get("total_results", 0),
            "results": formatted_results,
        }

    def format_image_url(self, path: str, size: str = "original") -> str:
        """Format a TMDB image URL"""
        if not path:
            return None
        return f"https://image.tmdb.org/t/p/{size}{path}"

    def parse_release_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse a TMDB release date string to datetime"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None

    def extract_genre_names(self, genres: List[Dict[str, Any]]) -> List[str]:
        """Extract genre names from TMDB genre objects"""
        if not genres:
            return []
        return [genre.get("name") for genre in genres if genre.get("name")]


# Singleton instance
tmdb_service = TMDBService()
