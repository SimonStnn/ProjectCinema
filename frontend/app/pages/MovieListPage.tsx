import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  type SelectChangeEvent,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import MovieCard from "../components/movies/MovieCard";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

const MovieListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(
    queryParams.get("query") || ""
  );
  const [category, setCategory] = useState(
    queryParams.get("category") || "now_playing"
  );
  const [sortBy, setSortBy] = useState(
    queryParams.get("sort") || "popularity.desc"
  );
  const [page, setPage] = useState(
    parseInt(queryParams.get("page") || "1", 10)
  );
  const [totalPages, setTotalPages] = useState(1);

  // Category options
  const categories = [
    { value: "now_playing", label: "Now Playing" },
    { value: "upcoming", label: "Coming Soon" },
    { value: "popular", label: "Popular" },
    { value: "top_rated", label: "Top Rated" },
  ];

  // Sort options
  const sortOptions = [
    { value: "popularity.desc", label: "Popularity (High to Low)" },
    { value: "popularity.asc", label: "Popularity (Low to High)" },
    { value: "vote_average.desc", label: "Rating (High to Low)" },
    { value: "vote_average.asc", label: "Rating (Low to High)" },
    { value: "release_date.desc", label: "Release Date (Newest)" },
    { value: "release_date.asc", label: "Release Date (Oldest)" },
  ];

  // Update query parameters in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (category) params.set("category", category);
    if (sortBy) params.set("sort", sortBy);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchQuery, category, sortBy, page, location.pathname]);

  // Fetch movies based on filters
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        let endpoint;
        let queryString = `?page=${page}&sort_by=${sortBy}`;

        if (searchQuery) {
          endpoint = "search";
          queryString += `&query=${encodeURIComponent(searchQuery)}`;
        } else {
          endpoint = category;
        }

        const response = await fetch(
          `${API_URL}/api/v1/movies/${endpoint}${queryString}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch movies: ${response.statusText}`);
        }

        const data = await response.json();
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, category, sortBy, page]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Trigger search by updating state which triggers useEffect
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setCategory(event.target.value);
    setPage(1); // Reset to first page on category change
    setSearchQuery(""); // Clear search when changing category
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value);
    setPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMovieClick = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {searchQuery
          ? `Search Results: "${searchQuery}"`
          : categories.find((cat) => cat.value === category)?.label || "Movies"}
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Grid>

          <Grid>
            <FormControl fullWidth disabled={!!searchQuery}>
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="Category"
                onChange={handleCategoryChange}
                disabled={!!searchQuery}
              >
                {categories.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid>
            <FormControl fullWidth>
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Movies Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={60} />
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
      ) : movies.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" paragraph>
            No movies found matching your criteria.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchQuery("");
              setCategory("now_playing");
              setSortBy("popularity.desc");
            }}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {movies.map((movie) => (
              <Grid key={movie.id}>
                <MovieCard
                  movie={movie}
                  onClick={() => handleMovieClick(movie.id)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default MovieListPage;
