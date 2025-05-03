import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router";
import MovieCard from "../components/movies/MovieCard";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Cinema" },
    { name: "description", content: "Vives IoT Devices: Project Cinema" },
  ];
}

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch featured (now playing) movies
        const featuredResponse = await fetch(
          `${API_URL}/api/v1/movies/now_playing`
        );

        // Fetch upcoming movies
        const upcomingResponse = await fetch(
          `${API_URL}/api/v1/movies/upcoming`
        );

        if (!featuredResponse.ok || !upcomingResponse.ok) {
          throw new Error("Failed to fetch movies");
        }

        const featuredData = await featuredResponse.json();
        const upcomingData = await upcomingResponse.json();

        setFeaturedMovies(featuredData || []);
        setUpcomingMovies(upcomingData || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleMovieClick = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <Box
        sx={{
          height: { xs: "50vh", md: "70vh" },
          backgroundImage: "linear-gradient(to right, #1d3557, #457b9d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          mb: 6,
          mt: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            maxWidth: "600px",
            color: "white",
            textAlign: "center",
            zIndex: 5,
            p: 3,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Movie Magic Awaits
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Experience the latest blockbusters in premium comfort
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate("/movies")}
          >
            Browse All Movies
          </Button>
        </Box>
      </Box>

      {/* Featured Movies Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h2">
            Now Showing
          </Typography>
          <Button
            color="primary"
            onClick={() => navigate("/movies")}
            sx={{ fontWeight: "bold" }}
          >
            View All
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper
            sx={{
              p: 3,
              bgcolor: "error.light",
              color: "error.contrastText",
              borderRadius: 1,
            }}
          >
            <Typography>{error}</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {featuredMovies.map((movie) => (
                <MovieCard key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieClick(movie.id)}
                />
            ))}
          </Grid>
        )}
      </Box>

      {/* Upcoming Movies Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h2">
            Coming Soon
          </Typography>
          <Button
            color="primary"
            onClick={() => navigate("/movies?category=upcoming")}
            sx={{ fontWeight: "bold" }}
          >
            View All
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper
            sx={{
              p: 3,
              bgcolor: "error.light",
              color: "error.contrastText",
              borderRadius: 1,
            }}
          >
            <Typography>{error}</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {upcomingMovies.map((movie) => (
              <Grid key={movie.id}>
                <MovieCard
                  movie={movie}
                  onClick={() => handleMovieClick(movie.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Promotion Section */}
      <Paper
        sx={{
          p: 4,
          mb: 6,
          background: "linear-gradient(45deg, #457b9d 30%, #1d3557 90%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid>
            <Typography variant="h4" gutterBottom>
              Membership Benefits
            </Typography>
            <Typography variant="body1" paragraph>
              Join our loyalty program and enjoy exclusive perks including
              discounted tickets, free snacks, and members-only screenings.
            </Typography>
            <Button variant="contained" color="secondary">
              Sign Up Now
            </Button>
          </Grid>
          <Grid>
            <Box
              sx={{
                height: "200px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h3">20% OFF</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default HomePage;
