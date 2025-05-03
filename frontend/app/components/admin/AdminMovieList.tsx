import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  Card,
  CardMedia,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";

interface Movie {
  id: number;
  tmdb_id: number | null;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  status: string;
  vote_average: number;
  genres: string[];
  director: string;
  cast: string[];
  trailer_url: string | null;
  created_at: string;
  updated_at: string;
}

const AdminMovieList = () => {
  const { token } = useAuthStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTmdbDialog, setOpenTmdbDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchLoading, setTmdbSearchLoading] = useState(false);

  // Form state for new/edit movie
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    release_date: "",
    runtime: "0",
    status: "Released",
    director: "",
    cast: "",
    trailer_url: "",
    poster_path: "",
    backdrop_path: "",
    vote_average: "0",
    genres: [] as string[],
  });

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/admin/movies?q=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch movies: ${response.statusText}`);
        }

        const data = await response.json();
        setMovies(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovies();
  }, [token, searchQuery, refreshTrigger]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (movie: Movie | null = null) => {
    setSelectedMovie(movie);
    if (movie) {
      setFormData({
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        runtime: movie.runtime.toString(),
        status: movie.status,
        director: movie.director,
        cast: movie.cast.join(", "),
        trailer_url: movie.trailer_url || "",
        poster_path: movie.poster_path || "",
        backdrop_path: movie.backdrop_path || "",
        vote_average: movie.vote_average.toString(),
        genres: movie.genres,
      });
    } else {
      setFormData({
        title: "",
        overview: "",
        release_date: new Date().toISOString().split("T")[0],
        runtime: "0",
        status: "Released",
        director: "",
        cast: "",
        trailer_url: "",
        poster_path: "",
        backdrop_path: "",
        vote_average: "0",
        genres: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMovie(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFormChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string | string[] } }
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFormData((prev) => ({
      ...prev,
      genres: event.target.value as string[],
    }));
  };

  const handleSaveMovie = async (event: React.FormEvent) => {
    event.preventDefault();

    // In a real implementation, you would send the data to your API
    // This is a placeholder that just closes the dialog
    console.log("Saving movie:", formData);

    handleCloseDialog();
    handleRefresh();
  };

  const handleDeleteMovie = async (movieId: number) => {
    try {
      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/movies/${movieId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete movie: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Open TMDB search dialog
  const handleOpenTmdbDialog = () => {
    setTmdbSearchQuery("");
    setTmdbSearchResults([]);
    setOpenTmdbDialog(true);
  };

  // Close TMDB search dialog
  const handleCloseTmdbDialog = () => {
    setOpenTmdbDialog(false);
  };

  // Handle TMDB search query change
  const handleTmdbSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTmdbSearchQuery(event.target.value);
  };

  // Search TMDB API
  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery.trim()) return;

    try {
      setTmdbSearchLoading(true);
      setError(null);

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/tmdb/search?query=${encodeURIComponent(
          tmdbSearchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search TMDB: ${response.statusText}`);
      }

      const data = await response.json();
      setTmdbSearchResults(data.results || []);
      setTmdbSearchLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setTmdbSearchLoading(false);
    }
  };

  // Import movie from TMDB
  const handleImportFromTmdb = async (tmdbId: number) => {
    try {
      setLoading(true);
      setError(null);

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/tmdb/import/${tmdbId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to import movie: ${response.statusText}`);
      }

      handleCloseTmdbDialog();
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };

  // Format runtime for display
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get poster URL (with fallback)
  const getPosterUrl = (path: string | null) => {
    if (!path) return null;

    if (path.startsWith("http")) {
      return path;
    }

    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Movie Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={handleOpenTmdbDialog}
          >
            Import from TMDB
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Movie
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Movies"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
            }}
          />
          <IconButton onClick={handleRefresh} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Movies Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>Poster</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Release Date</TableCell>
                <TableCell>Runtime</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Genres</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : movies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No movies found
                  </TableCell>
                </TableRow>
              ) : (
                movies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((movie) => (
                    <TableRow key={movie.id} hover>
                      <TableCell>
                        {movie.poster_path ? (
                          <Card
                            sx={{ width: 60, height: 90, overflow: "hidden" }}
                          >
                            <CardMedia
                              component="img"
                              image={getPosterUrl(movie.poster_path) || ""}
                              alt={movie.title}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Card>
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 90,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "grey.200",
                            }}
                          >
                            <MovieIcon sx={{ color: "grey.400" }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {movie.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            maxWidth: 300,
                          }}
                        >
                          {movie.overview}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(movie.release_date)}</TableCell>
                      <TableCell>{formatRuntime(movie.runtime)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Rating
                            name={`rating-${movie.id}`}
                            value={movie.vote_average / 2}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                          <Typography variant="body2" ml={1}>
                            {movie.vote_average.toFixed(1)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            maxWidth: 200,
                          }}
                        >
                          {movie.genres.map((genre, index) => (
                            <Chip
                              key={index}
                              label={genre}
                              size="small"
                              sx={{ fontSize: "0.7rem" }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(movie)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMovie(movie.id)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={movies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Movie Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMovie ? "Edit Movie" : "Add New Movie"}
        </DialogTitle>
        <form onSubmit={handleSaveMovie}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Poster Preview */}
              <Grid>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {formData.poster_path ? (
                    <Card
                      sx={{ width: "100%", maxHeight: 300, overflow: "hidden" }}
                    >
                      <CardMedia
                        component="img"
                        image={getPosterUrl(formData.poster_path) || ""}
                        alt={formData.title}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </Card>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 300,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "grey.200",
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 60, color: "grey.400" }} />
                    </Box>
                  )}

                  <TextField
                    label="Poster Path"
                    name="poster_path"
                    value={formData.poster_path}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    helperText="URL or TMDB path (e.g., /abc123.jpg)"
                  />
                </Box>
              </Grid>

              {/* Movie Details */}
              <Grid>
                <Grid container spacing={2}>
                  <Grid>
                    <TextField
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      fullWidth
                      required
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Release Date"
                      name="release_date"
                      type="date"
                      value={formData.release_date}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Runtime (minutes)"
                      name="runtime"
                      type="number"
                      value={formData.runtime}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid>
                    <FormControl fullWidth>
                      <InputLabel id="genres-label">Genres</InputLabel>
                      <Select
                        labelId="genres-label"
                        multiple
                        value={formData.genres}
                        onChange={(e) => handleGenreChange(e as any)}
                        renderValue={(selected) => (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {[
                          "Action",
                          "Adventure",
                          "Animation",
                          "Comedy",
                          "Crime",
                          "Documentary",
                          "Drama",
                          "Family",
                          "Fantasy",
                          "History",
                          "Horror",
                          "Music",
                          "Mystery",
                          "Romance",
                          "Science Fiction",
                          "Thriller",
                          "War",
                          "Western",
                        ].map((genre) => (
                          <MenuItem key={genre} value={genre}>
                            {genre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid>
                    <TextField
                      label="Director"
                      name="director"
                      value={formData.director}
                      onChange={handleFormChange}
                      fullWidth
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Average Rating (0-10)"
                      name="vote_average"
                      type="number"
                      value={formData.vote_average}
                      onChange={handleFormChange}
                      fullWidth
                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Cast (comma separated)"
                      name="cast"
                      value={formData.cast}
                      onChange={handleFormChange}
                      fullWidth
                      helperText="E.g. John Doe, Jane Smith, etc."
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Trailer URL"
                      name="trailer_url"
                      value={formData.trailer_url}
                      onChange={handleFormChange}
                      fullWidth
                      helperText="YouTube or other video URL"
                    />
                  </Grid>

                  <Grid>
                    <TextField
                      label="Backdrop Path"
                      name="backdrop_path"
                      value={formData.backdrop_path}
                      onChange={handleFormChange}
                      fullWidth
                      helperText="URL or TMDB path for background image"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Overview */}
              <Grid>
                <TextField
                  label="Overview"
                  name="overview"
                  value={formData.overview}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* TMDB Search Dialog */}
      <Dialog
        open={openTmdbDialog}
        onClose={handleCloseTmdbDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Movie from TMDB</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, display: "flex", gap: 1 }}>
            <TextField
              label="Search TMDB"
              value={tmdbSearchQuery}
              onChange={handleTmdbSearchChange}
              fullWidth
              variant="outlined"
              size="small"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleTmdbSearch();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleTmdbSearch}
              disabled={tmdbSearchLoading}
            >
              {tmdbSearchLoading ? <CircularProgress size={24} /> : "Search"}
            </Button>
          </Box>

          {tmdbSearchLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : tmdbSearchResults.length > 0 ? (
            <Grid container spacing={2}>
              {tmdbSearchResults.map((movie) => (
                <Grid key={movie.id}>
                  <Card sx={{ height: "100%" }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : "https://via.placeholder.com/500x750?text=No+Poster"
                      }
                      alt={movie.title}
                      sx={{ objectFit: "cover" }}
                    />
                    <Box sx={{ p: 2 }}>
                      <Typography
                        variant="h6"
                        component="div"
                        gutterBottom
                        noWrap
                      >
                        {movie.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {movie.overview}
                      </Typography>
                      <Typography variant="body2">
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "Unknown"}
                      </Typography>
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={() => handleImportFromTmdb(movie.id)}
                        >
                          Import
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : tmdbSearchQuery ? (
            <Box sx={{ textAlign: "center", my: 4 }}>
              <Typography variant="body1">
                No results found. Try another search term.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", my: 4 }}>
              <Typography variant="body1">
                Search for movies by title to import from TMDB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTmdbDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMovieList;
