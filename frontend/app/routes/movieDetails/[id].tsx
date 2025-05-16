import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Rating } from "@mui/material";
import {
  AccessTime as TimeIcon,
  CalendarMonth,
  Star,
  People,
  Warning,
} from "@mui/icons-material";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { format, parseISO } from "date-fns";
import ScreeningsList from "@/components/ScreeningsList";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

interface Screening {
  id: string;
  movie_id: number;
  start_time: string;
  end_time: string | null;
  price: number;
  room: string;
  available_tickets: number;
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [screeningsLoading, setScreeningsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/movies/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch movie details");
        }

        const data = await response.json();
        setMovie(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie details. Please try again later.");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Fetch screenings
  useEffect(() => {
    const fetchScreenings = async () => {
      if (!id) return;

      try {
        setScreeningsLoading(true);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/screenings?movie_id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch screenings");
        }

        const data = await response.json();
        setScreenings(data);
        setScreeningsLoading(false);
      } catch (err) {
        console.error("Error fetching screenings:", err);
        setScreeningsLoading(false);
      }
    };

    fetchScreenings();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertTitle>Movie Not Found</AlertTitle>
          <AlertDescription>
            The movie you are looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/movies")} className="mt-4">
          Back to Movies
        </Button>
      </div>
    );
  }

  // Get backdrop and poster image URLs
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "https://placehold.co/1920x1080/225/FFF?text=No+Backdrop";

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/225/FFF?text=No+Poster";

  // Format runtime to hours and minutes
  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return "Unknown";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div>
      {/* Backdrop Image */}
      <div
        className="w-full h-[400px] bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${backdropUrl})`,
        }}
      >
        <div className="container mx-auto px-4 flex h-full items-end pb-12">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Movie Poster */}
            <div className="w-48 h-72 flex-shrink-0">
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                className="w-full h-full object-cover rounded-md shadow-lg"
              />
            </div>

            {/* Movie Info */}
            <div className="flex flex-col text-white">
              <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>

              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                {movie.genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant="outline"
                    className="border-white"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center">
                  <TimeIcon className="mr-1 h-4 w-4" />
                  <span>{formatRuntime(movie.runtime)}</span>
                </div>
                <div className="flex items-center">
                  <CalendarMonth className="mr-1 h-4 w-4" />
                  <span>
                    {movie.release_date
                      ? format(parseISO(movie.release_date), "MMMM d, yyyy")
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 text-yellow-400" />
                  <span>{movie.vote_average.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center">
                  <People className="mr-1 h-4 w-4" />
                  <span>{movie.vote_count.toLocaleString()} votes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Overview */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-lg leading-relaxed">{movie.overview}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Rating */}
          <div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">Rating</h2>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {movie.vote_average.toFixed(1)}
                  </div>
                  <Rating
                    value={movie.vote_average / 2}
                    precision={0.5}
                    readOnly
                    size="large"
                  />
                  <div className="mt-2 text-sm text-muted-foreground">
                    Based on {movie.vote_count.toLocaleString()} votes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Screenings */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Screenings</h2>
          <ScreeningsList
            movieId={parseInt(id!)}
            screenings={screenings}
            isLoading={screeningsLoading}
          />
        </div>
      </div>
    </div>
  );
}
