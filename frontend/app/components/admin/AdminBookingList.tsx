import { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  //   EventNote as EventNoteIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";
import { format } from "date-fns";

interface Booking {
  id: string;
  user_id: string;
  user_name: string;
  showing_id: string;
  movie_title: string;
  cinema_name: string;
  room_name: string;
  showing_time: string;
  booking_date: string;
  seats: string[];
  total_price: number;
  status: "confirmed" | "cancelled" | "completed";
  payment_method: string;
  payment_id: string | null;
}

const AdminBookingList = () => {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "confirmed",
  });

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/admin/bookings?q=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.statusText}`);
        }

        const data = await response.json();
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchBookings();
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenDetailsDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedBooking(null);
  };

  const handleOpenEditDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      status: booking.status,
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedBooking(null);
  };

  const handleFormChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const name = event.target.name as string;
    const value = event.target.value as string;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBooking = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (!selectedBooking) return;

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/bookings/${selectedBooking.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: editFormData.status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update booking: ${response.statusText}`);
      }

      handleCloseEditDialog();
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/bookings/${bookingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
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
          Booking Management
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Bookings"
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

      {/* Bookings Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Movie</TableCell>
                <TableCell>Cinema/Room</TableCell>
                <TableCell>Showing Time</TableCell>
                <TableCell>Seats</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>{booking.id.substring(0, 8)}</TableCell>
                      <TableCell>{booking.user_name}</TableCell>
                      <TableCell>{booking.movie_title}</TableCell>
                      <TableCell>
                        {booking.cinema_name} / {booking.room_name}
                      </TableCell>
                      <TableCell>{formatDate(booking.showing_time)}</TableCell>
                      <TableCell>
                        {booking.seats.length > 3
                          ? `${booking.seats.slice(0, 3).join(", ")}...`
                          : booking.seats.join(", ")}
                      </TableCell>
                      <TableCell>${booking.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={
                            booking.status === "confirmed"
                              ? "primary"
                              : booking.status === "completed"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetailsDialog(booking)}
                          title="View Details"
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(booking)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteBooking(booking.id)}
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
          count={bookings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Booking Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={2}>
              <Grid>
                <Typography variant="subtitle2">Booking ID</Typography>
                <Typography variant="body1">{selectedBooking.id}</Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body1">
                  {formatDate(selectedBooking.booking_date)}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">User</Typography>
                <Typography variant="body1">
                  {selectedBooking.user_name}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Movie</Typography>
                <Typography variant="body1">
                  {selectedBooking.movie_title}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Cinema</Typography>
                <Typography variant="body1">
                  {selectedBooking.cinema_name}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Room</Typography>
                <Typography variant="body1">
                  {selectedBooking.room_name}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Showing Time</Typography>
                <Typography variant="body1">
                  {formatDate(selectedBooking.showing_time)}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={selectedBooking.status}
                  color={
                    selectedBooking.status === "confirmed"
                      ? "primary"
                      : selectedBooking.status === "completed"
                      ? "success"
                      : "error"
                  }
                  size="small"
                />
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Seats</Typography>
                <Typography variant="body1">
                  {selectedBooking.seats.join(", ")}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Total Price</Typography>
                <Typography variant="body1">
                  ${selectedBooking.total_price.toFixed(2)}
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="subtitle2">Payment Method</Typography>
                <Typography variant="body1">
                  {selectedBooking.payment_method}
                </Typography>
              </Grid>
              {selectedBooking.payment_id && (
                <Grid>
                  <Typography variant="subtitle2">Payment ID</Typography>
                  <Typography variant="body1">
                    {selectedBooking.payment_id}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
          {selectedBooking && (
            <Button
              onClick={() => {
                handleCloseDetailsDialog();
                handleOpenEditDialog(selectedBooking);
              }}
              color="primary"
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Booking Status</DialogTitle>
        <form onSubmit={handleSaveBooking}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid>
                <FormControl fullWidth required>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={editFormData.status}
                    label="Status"
                    onChange={(e) => handleFormChange(e as any)}
                  >
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminBookingList;
