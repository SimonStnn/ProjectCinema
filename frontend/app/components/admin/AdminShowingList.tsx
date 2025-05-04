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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  //   EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";
import { format } from "date-fns";

interface Showing {
  id: string;
  movie_id: number;
  movie_title: string;
  cinema_id: string;
  cinema_name: string;
  room_id: string;
  room_name: string;
  start_time: string;
  end_time: string;
  price: number;
  available_seats: number;
  total_seats: number;
  status: "Scheduled" | "Cancelled" | "Completed";
}

interface Cinema {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  cinema_id: string;
  seat_count: number;
}

interface Movie {
  id: number;
  title: string;
  runtime: number;
}

const AdminShowingList = () => {
  const { token } = useAuthStore();
  const [showings, setShowings] = useState<Showing[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [_, setRooms] = useState<Room[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShowing, setSelectedShowing] = useState<Showing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form state for new/edit showing
  const [formData, setFormData] = useState({
    movieId: "",
    cinemaId: "",
    roomId: "",
    startTime: "",
    price: "10.00",
    status: "Scheduled",
  });

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  // Fetch showings and related data from API
  useEffect(() => {
    const fetchShowingsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch all required data in parallel
        const [showingsResponse, cinemasResponse, moviesResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/v1/admin/showings?q=${searchQuery}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/v1/admin/cinemas`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/v1/admin/movies`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        if (!showingsResponse.ok || !cinemasResponse.ok || !moviesResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }

        const showingsData = await showingsResponse.json();
        const cinemasData = await cinemasResponse.json();
        const moviesData = await moviesResponse.json();

        setShowings(showingsData);
        setCinemas(cinemasData);
        setMovies(moviesData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchShowingsData();
  }, [token, searchQuery, refreshTrigger]);

  // When cinema is selected, fetch its rooms
  useEffect(() => {
    const fetchRooms = async (cinemaId: string) => {
      if (!cinemaId) {
        setRooms([]);
        return;
      }

      try {
        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/cinema/rooms`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const data = await response.json();
        setRooms(data);
        setAvailableRooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    if (formData.cinemaId) {
      fetchRooms(formData.cinemaId);
    }
  }, [token, formData.cinemaId]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (showing: Showing | null = null) => {
    setSelectedShowing(showing);
    if (showing) {
      setFormData({
        movieId: showing.movie_id.toString(),
        cinemaId: showing.cinema_id,
        roomId: showing.room_id,
        startTime: showing.start_time.slice(0, 16), // Format as YYYY-MM-DDThh:mm
        price: showing.price.toString(),
        status: showing.status,
      });
    } else {
      setFormData({
        movieId: "",
        cinemaId: "",
        roomId: "",
        startTime: new Date().toISOString().slice(0, 16),
        price: "10.00",
        status: "Scheduled",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedShowing(null);
    setFormData({
      movieId: "",
      cinemaId: "",
      roomId: "",
      startTime: "",
      price: "10.00",
      status: "Scheduled",
    });
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
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveShowing = async (event: React.FormEvent) => {
    event.preventDefault();

    // In a real implementation, you would send the data to your API
    // This is a placeholder that just closes the dialog
    console.log("Saving showing:", formData);

    handleCloseDialog();
    handleRefresh();
  };

  const handleDeleteShowing = async (showingId: string) => {
    try {
      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/showings/${showingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete showing: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Calculate occupancy percentage
  const calculateOccupancy = (available: number, total: number) => {
    if (total === 0) return "0%";
    const occupancy = ((total - available) / total) * 100;
    return `${Math.round(occupancy)}%`;
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
          Showings Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Showing
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Showings"
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

      {/* Showings Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>ID</TableCell>
                <TableCell>Movie</TableCell>
                <TableCell>Cinema / Room</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Occupancy</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : showings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No showings found
                  </TableCell>
                </TableRow>
              ) : (
                showings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((showing) => (
                    <TableRow key={showing.id} hover>
                      <TableCell>{showing.id.substring(0, 8)}</TableCell>
                      <TableCell>{showing.movie_title}</TableCell>
                      <TableCell>
                        {showing.cinema_name} / {showing.room_name}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <TodayIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDateTime(showing.start_time)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            to {formatDateTime(showing.end_time)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>${showing.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {calculateOccupancy(
                          showing.available_seats,
                          showing.total_seats
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {showing.available_seats} of {showing.total_seats}{" "}
                          available
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={showing.status}
                          color={
                            showing.status === "Scheduled"
                              ? "primary"
                              : showing.status === "Completed"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(showing)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteShowing(showing.id)}
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
          count={showings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Showing Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedShowing ? "Edit Showing" : "Add New Showing"}
        </DialogTitle>
        <form onSubmit={handleSaveShowing}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid>
                <FormControl fullWidth required>
                  <InputLabel id="movie-select-label">Movie</InputLabel>
                  <Select
                    labelId="movie-select-label"
                    id="movie-select"
                    name="movieId"
                    value={formData.movieId}
                    label="Movie"
                    onChange={(e) =>
                      handleFormChange({
                        target: {
                          name: "movieId",
                          value: e.target.value as string,
                        },
                      })
                    }
                  >
                    {movies.map((movie) => (
                      <MenuItem key={movie.id} value={movie.id.toString()}>
                        {movie.title} ({movie.runtime} min)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid>
                <FormControl fullWidth required>
                  <InputLabel id="cinema-select-label">Cinema</InputLabel>
                  <Select
                    labelId="cinema-select-label"
                    id="cinema-select"
                    name="cinemaId"
                    value={formData.cinemaId}
                    label="Cinema"
                    onChange={(e) =>
                      handleFormChange({
                        target: {
                          name: "cinemaId",
                          value: e.target.value as string,
                        },
                      })
                    }
                  >
                    {cinemas.map((cinema) => (
                      <MenuItem key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid>
                <FormControl fullWidth required disabled={!formData.cinemaId}>
                  <InputLabel id="room-select-label">Room</InputLabel>
                  <Select
                    labelId="room-select-label"
                    id="room-select"
                    name="roomId"
                    value={formData.roomId}
                    label="Room"
                    onChange={(e) =>
                      handleFormChange({
                        target: {
                          name: "roomId",
                          value: e.target.value as string,
                        },
                      })
                    }
                  >
                    {availableRooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.name} ({room.seat_count} seats)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  fullWidth
                  required
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid>
                <TextField
                  label="Price ($)"
                  type="number"
                  fullWidth
                  required
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>

              <Grid>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    id="status-select"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={(e) =>
                      handleFormChange({
                        target: {
                          name: "status",
                          value: e.target.value as string,
                        },
                      })
                    }
                  >
                    <MenuItem value="Scheduled">Scheduled</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
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
    </Box>
  );
};

export default AdminShowingList;
