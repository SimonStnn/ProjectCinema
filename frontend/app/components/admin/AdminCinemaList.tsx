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
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";

interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  status: "Active" | "Closed" | "Renovating";
  room_count: number;
  created_at: string;
}

const AdminCinemaList = () => {
  const { token } = useAuthStore();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch cinemas from API
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/admin/cinemas?q=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch cinemas: ${response.statusText}`);
        }

        const data = await response.json();
        setCinemas(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchCinemas();
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

  const handleOpenDialog = (cinema: Cinema | null = null) => {
    setSelectedCinema(cinema);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCinema(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaveCinema = async (event: React.FormEvent) => {
    event.preventDefault();
    // Implementation would include API call to save cinema
    // For now, just close the dialog
    handleCloseDialog();
    handleRefresh();
  };

  const handleDeleteCinema = async (cinemaId: string) => {
    try {
      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/cinemas/${cinemaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete cinema: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Format date for display
//   const formatDate = (dateString: string) => {
//     const options: Intl.DateTimeFormatOptions = {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     };
//     return new Date(dateString).toLocaleDateString(undefined, options);
//   };

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
          Cinema Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Cinema
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Cinemas"
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

      {/* Cinemas Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Rooms</TableCell>
                <TableCell>Status</TableCell>
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
              ) : cinemas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No cinemas found
                  </TableCell>
                </TableRow>
              ) : (
                cinemas
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((cinema) => (
                    <TableRow key={cinema.id} hover>
                      <TableCell>{cinema.id.substring(0, 8)}</TableCell>
                      <TableCell>{cinema.name}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LocationIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2">
                              {cinema.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {cinema.city}, {cinema.state} {cinema.zip_code}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{cinema.phone}</Typography>
                        <Typography variant="body2">{cinema.email}</Typography>
                      </TableCell>
                      <TableCell align="center">{cinema.room_count}</TableCell>
                      <TableCell>
                        <Chip
                          label={cinema.status}
                          color={
                            cinema.status === "Active"
                              ? "success"
                              : cinema.status === "Renovating"
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(cinema)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCinema(cinema.id)}
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
          count={cinemas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Cinema Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCinema ? "Edit Cinema" : "Add New Cinema"}
        </DialogTitle>
        <form onSubmit={handleSaveCinema}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Cinema Name"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.name || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.address || ""}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.city || ""}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.state || ""}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="ZIP Code"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.zip_code || ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  required
                  defaultValue={selectedCinema?.phone || ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  required
                  defaultValue={selectedCinema?.email || ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  select
                  fullWidth
                  required
                  defaultValue={selectedCinema?.status || "Active"}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Renovating">Renovating</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Number of Rooms"
                  fullWidth
                  type="number"
                  inputProps={{ min: 1 }}
                  required
                  defaultValue={selectedCinema?.room_count || 1}
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
    </Box>
  );
};

export default AdminCinemaList;
