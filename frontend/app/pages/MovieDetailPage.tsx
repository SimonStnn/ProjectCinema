import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
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
} from "@mui/icons-material";
import { format } from "date-fns";

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

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
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch movie details - use by-tmdb-id endpoint since we're getting a TMDB ID from the URL
        const movieResponse = await fetch(
          `${API_URL}/api/v1/movies/tmdb/${id}`
        );
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie: ${movieResponse.statusText}`);
        }

        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch showings for this movie
        const showingsResponse = await fetch(
          `${API_URL}/api/v1/showings?movie_id=${id}`
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
  }, [id]);

  const handleDateChange = (event: SelectChangeEvent) => {
    setSelectedDate(event.target.value);
  };

  const handleBookingClick = (showingId: string) => {
    if (!id) return;
    navigate(`/booking/${id}/${showingId}`);
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
      return format(date, "h:mm a");
    } catch (error) {
      return isoString;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
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

  if (error || !movie) {
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
            {error || "Movie not found. Please try again later."}
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

  return (
    <Box>
      {/* Backdrop Header */}
      <Box
        sx={{
          height: { xs: "40vh", md: "70vh" },
          position: "relative",
          backgroundImage: movie.backdrop_path
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
            : "linear-gradient(to bottom, #1d3557, #457b9d)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "flex-end",
          mb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid>
              <Box
                component="img"
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder-poster.jpg"
                }
                alt={movie.title}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  boxShadow: 5,
                  maxHeight: "350px",
                  objectFit: "cover",
                }}
              />
            </Grid>
            <Grid sx={{ color: "white" }}>
              <Typography variant="h3" component="h1" gutterBottom>
                {movie.title}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Rating
                  value={movie.vote_average / 2}
                  precision={0.5}
                  readOnly
                />
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {(movie.vote_average / 2).toFixed(1)} ({movie.vote_count}{" "}
                  reviews)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {movie.genres.map((genre) => (
                  <Chip
                    key={genre.id}
                    label={genre.name}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: "rgba(255,255,255,0.5)",
                      color: "white",
                    }}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 3,
                  mb: 3,
                  "& > div": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              >
                <Box>
                  <CalendarMonth sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {format(new Date(movie.release_date), "MMMM d, yyyy")}
                  </Typography>
                </Box>
                <Box>
                  <TimeIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {formatRuntime(movie.runtime)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Overview
              </Typography>
              <Typography variant="body1" paragraph>
                {movie.overview}
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Showings Section */}
      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Movie Showtimes
        </Typography>

        {showings.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" align="center" color="text.secondary">
              No showings are currently available for this movie.
            </Typography>
          </Paper>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <FormControl fullWidth>
                    <InputLabel id="date-select-label">Select Date</InputLabel>
                    <Select
                      labelId="date-select-label"
                      id="date-select"
                      value={selectedDate}
                      label="Select Date"
                      onChange={handleDateChange}
                    >
                      {availableDates.map((date) => (
                        <MenuItem key={date} value={date}>
                          {formatDate(date)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {selectedDate && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  {formatDate(selectedDate)}
                </Typography>

                <Grid container spacing={3}>
                  {showingsByDate[selectedDate]?.map((showing) => (
                    <Grid key={showing.id}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {formatShowtime(showing.start_time)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Room: {showing.room_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price: ${showing.price.toFixed(2)}
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<SeatIcon />}
                            onClick={() => handleBookingClick(showing.id)}
                          >
                            Select Seats
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default MovieDetailPage;
