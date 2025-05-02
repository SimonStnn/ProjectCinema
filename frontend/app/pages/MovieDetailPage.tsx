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

interface Cinema {
  id: string;
  name: string;
  address: string;
}

interface Showing {
  id: string;
  movie_id: number;
  cinema_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  price: number;
  cinema_name: string;
  room_name: string;
}

interface ShowingsByDate {
  [date: string]: {
    [cinemaId: string]: Showing[];
  };
}

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCinema, setSelectedCinema] = useState<string>("");

  // Group showings by date and cinema
  const showingsByDate: ShowingsByDate = {};
  showings.forEach((showing) => {
    // Get date part only
    const date = showing.start_time.split("T")[0];
    if (!showingsByDate[date]) {
      showingsByDate[date] = {};
    }
    if (!showingsByDate[date][showing.cinema_id]) {
      showingsByDate[date][showing.cinema_id] = [];
    }
    showingsByDate[date][showing.cinema_id].push(showing);
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

        // Fetch movie details
        const movieResponse = await fetch(`${API_URL}/api/v1/movies/${id}`);
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

        // Fetch all cinemas
        const cinemasResponse = await fetch(`${API_URL}/api/v1/cinemas`);
        if (!cinemasResponse.ok) {
          throw new Error(
            `Failed to fetch cinemas: ${cinemasResponse.statusText}`
          );
        }

        const cinemasData = await cinemasResponse.json();
        setCinemas(cinemasData);

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
    setSelectedCinema("");
  };

  const handleCinemaChange = (event: SelectChangeEvent) => {
    setSelectedCinema(event.target.value);
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={9} sx={{ color: "white" }}>
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
                <Grid item xs={12} md={6}>
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

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedDate}>
                    <InputLabel id="cinema-select-label">
                      Select Cinema
                    </InputLabel>
                    <Select
                      labelId="cinema-select-label"
                      id="cinema-select"
                      value={selectedCinema}
                      label="Select Cinema"
                      onChange={handleCinemaChange}
                    >
                      <MenuItem value="">All Cinemas</MenuItem>
                      {selectedDate &&
                        Object.keys(showingsByDate[selectedDate] || {}).map(
                          (cinemaId) => {
                            const cinema = cinemas.find(
                              (c) => c.id === cinemaId
                            );
                            return (
                              <MenuItem key={cinemaId} value={cinemaId}>
                                {cinema ? cinema.name : "Unknown Cinema"}
                              </MenuItem>
                            );
                          }
                        )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {selectedDate && (
              <Box>
                {Object.entries(showingsByDate[selectedDate] || {})
                  .filter(
                    ([cinemaId]) =>
                      !selectedCinema || cinemaId === selectedCinema
                  )
                  .map(([cinemaId, cinemaShowings]) => {
                    const cinema = cinemas.find((c) => c.id === cinemaId);
                    return (
                      <Card
                        key={cinemaId}
                        sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {cinema ? cinema.name : "Unknown Cinema"}
                          </Typography>
                          {cinema && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              paragraph
                            >
                              {cinema.address}
                            </Typography>
                          )}

                          <Divider sx={{ my: 2 }} />

                          <Grid container spacing={2}>
                            {cinemaShowings
                              .sort(
                                (a, b) =>
                                  new Date(a.start_time).getTime() -
                                  new Date(b.start_time).getTime()
                              )
                              .map((showing) => (
                                <Grid
                                  item
                                  key={showing.id}
                                  xs={6}
                                  sm={4}
                                  md={3}
                                >
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    onClick={() =>
                                      handleBookingClick(showing.id)
                                    }
                                    sx={{
                                      p: 1,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      height: "100%",
                                    }}
                                  >
                                    <Typography variant="h6">
                                      {formatShowtime(showing.start_time)}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mt: 1,
                                      }}
                                    >
                                      <SeatIcon
                                        fontSize="small"
                                        sx={{ mr: 0.5 }}
                                      />
                                      <Typography variant="body2">
                                        {showing.room_name}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mt: 1 }}
                                    >
                                      ${showing.price.toFixed(2)}
                                    </Typography>
                                  </Button>
                                </Grid>
                              ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default MovieDetailPage;
