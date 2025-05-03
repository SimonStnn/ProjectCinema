import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "../store/authStore";
import SeatSelection from "../components/booking/SeatSelection";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

interface Showing {
  id: string;
  movie_id: number;
  room_id: string;
  room_name: string;
  start_time: string;
  end_time: string;
  price: number;
}

const BookingPage = () => {
  const { movieId, showingId } = useParams<{
    movieId: string;
    showingId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showing, setShowing] = useState<Showing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cinemaName = "Grand Cinema"; // Use static cinema name

  // Fetch movie and showing data
  useEffect(() => {
    const fetchData = async () => {
      if (!movieId || !showingId) {
        setError("Invalid booking parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch movie details
        const movieResponse = await fetch(
          `${API_URL}/api/v1/movies/${movieId}`
        );
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie: ${movieResponse.statusText}`);
        }

        // Fetch showing details
        const showingResponse = await fetch(
          `${API_URL}/api/v1/showings/${showingId}`
        );
        if (!showingResponse.ok) {
          throw new Error(
            `Failed to fetch showing: ${showingResponse.statusText}`
          );
        }

        const movieData = await movieResponse.json();
        const showingData = await showingResponse.json();

        setMovie(movieData);
        setShowing(showingData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId, showingId]);

  // Format ISO date to readable format
  const formatShowtime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !movie || !showing) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 3,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">
            {error || "Booking information not found. Please try again."}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/movies")}
          >
            Back to Movies
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Please log in to continue
          </Typography>
          <Typography variant="body1" paragraph>
            You need to be logged in to book movie tickets.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
          >
            Log In
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Booking Header */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            component="img"
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : "/placeholder-poster.jpg"
            }
            alt={movie.title}
            sx={{
              width: "100px",
              borderRadius: 1,
              mr: 3,
              display: { xs: "none", sm: "block" },
            }}
          />

          <Box>
            <Typography variant="h4" gutterBottom>
              {movie.title}
            </Typography>
            <Typography variant="body1">
              {cinemaName} | {showing.room_name} |{" "}
              {formatShowtime(showing.start_time)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Seat Selection Component */}
      <SeatSelection
        showingId={showing.id}
        movieTitle={movie.title}
        showtime={formatShowtime(showing.start_time)}
        cinemaName={cinemaName}
        roomName={showing.room_name}
        price={showing.price}
        userId={user.id}
      />
    </Container>
  );
};

export default BookingPage;
