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
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned";
  created_at: string;
  last_login: string | null;
  profile_picture?: string | null;
}

const AdminUserList = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form state for new/edit user
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
    status: "active",
    password: "",
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/admin/users?q=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchUsers();
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

  const handleOpenDialog = (user: User | null = null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        password: "", // Don't populate password field for security
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "user",
        status: "active",
        password: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
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

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();

    // In a real implementation, you would send the data to your API
    // This is a placeholder that just closes the dialog
    console.log("Saving user:", formData);

    handleCloseDialog();
    handleRefresh();
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // API URL from environment variables or fallback
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string
  ) => {
    try {
      // API URL from environment variables or fallback
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const response = await fetch(
        `${API_URL}/api/v1/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update user status: ${response.statusText}`);
      }

      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";

    try {
      return format(new Date(dateString), "PPp");
    } catch (error) {
      return dateString;
    }
  };

  // Get user initials for avatar
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get avatar background color based on user id (for consistency)
  const getAvatarColor = (userId: string) => {
    const colors = [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
      "#03A9F4",
      "#00BCD4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
    ];

    // Simple hash function to get consistent color
    const hash = userId.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
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
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            label="Search Users"
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

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Login</TableCell>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          {user.profile_picture ? (
                            <Avatar
                              src={user.profile_picture}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                          ) : (
                            <Avatar sx={{ bgcolor: getAvatarColor(user.id) }}>
                              {getUserInitials(user.first_name, user.last_name)}
                            </Avatar>
                          )}
                          <Typography>
                            {user.first_name} {user.last_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.toUpperCase()}
                          color={
                            user.role === "admin" ? "secondary" : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={
                            user.status === "active"
                              ? "success"
                              : user.status === "inactive"
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_login)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleToggleUserStatus(user.id, user.status)
                          }
                          title={
                            user.status === "active" ? "Deactivate" : "Activate"
                          }
                          color={
                            user.status === "active" ? "default" : "primary"
                          }
                        >
                          {user.status === "active" ? (
                            <LockIcon fontSize="small" />
                          ) : (
                            <LockOpenIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id)}
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
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
        <form onSubmit={handleSaveUser}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="firstName"
                  fullWidth
                  required
                  value={formData.firstName}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="lastName"
                  fullWidth
                  required
                  value={formData.lastName}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </Grid>
              {!selectedUser && (
                <Grid item xs={12}>
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    fullWidth
                    required={!selectedUser}
                    value={formData.password}
                    onChange={handleFormChange}
                    helperText={
                      selectedUser ? "Leave blank to keep current password" : ""
                    }
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={(e) =>
                      handleFormChange({
                        target: {
                          name: "role",
                          value: e.target.value as string,
                        },
                      })
                    }
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
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
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="banned">Banned</MenuItem>
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

export default AdminUserList;
