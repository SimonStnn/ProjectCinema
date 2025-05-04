import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Rating,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  CalendarMonth,
  EventSeat as SeatIcon,
  Warning,
} from "@mui/icons-material";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

interface Showing {
  id: string;
  movie_id: number;
  room_id: string;
  start_time: string;
  end_time: string;
  price: number;
  room_name: string;
}

interface ShowingsByDate {
  [date: string]: Showing[];
}

const MovieDetailPage = () => {
  const { movie_id } = useParams<{ movie_id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  console.log("id", movie_id);

  // Group showings by date
  const showingsByDate: ShowingsByDate = {};
  showings.forEach((showing) => {
    // Get date part only
    const date = showing.start_time.split("T")[0];
    if (!showingsByDate[date]) {
      showingsByDate[date] = [];
    }
    showingsByDate[date].push(showing);
  });

  // Get unique dates for filtering
  const availableDates = Object.keys(showingsByDate).sort();

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!movie_id) return;

      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch movie details - use by-tmdb-id endpoint since we're getting a TMDB ID from the URL
        const movieResponse = await fetch(
          `${API_URL}/api/v1/movies/tmdb/${movie_id}`
        );
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie: ${movieResponse.statusText}`);
        }

        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch showings for this movie
        const showingsResponse = await fetch(
          `${API_URL}/api/v1/showings?movie_id=${movie_id}`
        );
        if (!showingsResponse.ok) {
          throw new Error(
            `Failed to fetch showings: ${showingsResponse.statusText}`
          );
        }

        const showingsData = await showingsResponse.json();
        setShowings(showingsData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movie_id]);

  const handleDateChange = (event: SelectChangeEvent) => {
    setSelectedDate(event.target.value);
  };

  const handleBookingClick = (showingId: string) => {
    if (!movie_id) return;
    navigate(`/booking/${movie_id}/${showingId}`);
  };

  // Format minutes to hours and minutes
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format the showing time
  const formatShowtime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        date.toLocaleDateString([], { month: "2-digit", day: "2-digit" })
      );
    } catch (error) {
      return isoString;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto mt-10 flex justify-center items-center"></div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto mt-10">
        <Alert variant="destructive" className="border-destructive">
          <Warning className="size-4" />
          <AlertTitle>Movie not found</AlertTitle>
          <AlertDescription className="flex justify-between">
            Please try again later.
            <Button variant="destructive" onClick={() => navigate("/movies")}>
              Back to Movies
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop Header */}
      <div
        className={cn(
          "relative h-[70dvh] bg-linear-to-b from-sky-700 to-sky-900"
          // movie.backdrop_path && `bg-[url(https://image.tmdb.org/t/p/original${movie.backdrop_path})] `
        )}
      >
        <img
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
          alt={`${movie.title} backdrop`}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="container mx-auto flex flex-col justify-end items-start h-full py-5 px-2 sm:px-0 text-white *:z-10 xl:flex-row xl:justify-start xl:gap-5 xl:items-end">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`${movie.title} poster`}
            className="h-[350px] rounded-lg shadow-lg object-cover invisible sm:visible"
          />
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>

            <div className="flex items-center mb-2" title="Rating">
              <Rating value={movie.vote_average / 2} precision={0.5} readOnly />
              <p className="ml-2 text-sm">
                {(movie.vote_average / 2).toFixed(1)} ({movie.vote_count}{" "}
                reviews)
              </p>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {movie.genres.map((genre) => (
                <Badge key={genre.id} variant="outline" className="text-white">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-1" title="Release Date">
                <CalendarMonth />
                <p>{new Date(movie.release_date).toDateString()}</p>
              </div>
              <div className="flex items-center gap-1" title="Runtime">
                <TimeIcon />
                <p>{formatRuntime(movie.runtime)}</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2">Overview</h3>
            <p className=" md:w-8/12">{movie.overview}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-10">
        <h2 className="text-3xl font-bold mb-4">Showings</h2>
      </div>
    </>
  );
};

export default MovieDetailPage;
