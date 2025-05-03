import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";

interface CinemaInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  description: string;
}

const CinemaSettings = () => {
  const { token } = useAuthStore();
  const [cinemaInfo, setCinemaInfo] = useState<CinemaInfo>({
    name: "Grand Cinema",
    address: "123 Main Street",
    city: "Movie City",
    state: "CA",
    postal_code: "90210",
    phone: "555-123-4567",
    email: "info@grandcinema.com",
    description: "The best cinema experience in town",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch cinema information on component mount
  useEffect(() => {
    const fetchCinemaInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(`${API_URL}/api/v1/cinema`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch cinema info: ${response.statusText}`
          );
        }

        const data = await response.json();
        setCinemaInfo(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchCinemaInfo();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCinemaInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSuccess(null);
      setError(null);

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/api/v1/admin/cinema`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cinemaInfo),
      });

      if (!response.ok) {
        throw new Error(`Failed to update cinema info: ${response.statusText}`);
      }

      setSuccess("Cinema information updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
          Cinema Settings
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Cinema Information Form */}
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid>
                <TextField
                  name="name"
                  label="Cinema Name"
                  fullWidth
                  required
                  value={cinemaInfo.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={cinemaInfo.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  required
                  value={cinemaInfo.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="city"
                  label="City"
                  fullWidth
                  required
                  value={cinemaInfo.city}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="state"
                  label="State/Province"
                  fullWidth
                  value={cinemaInfo.state}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="postal_code"
                  label="Postal Code"
                  fullWidth
                  value={cinemaInfo.postal_code}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="phone"
                  label="Phone"
                  fullWidth
                  value={cinemaInfo.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <TextField
                  name="email"
                  label="Email"
                  fullWidth
                  type="email"
                  value={cinemaInfo.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    startIcon={<SaveIcon />}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default CinemaSettings;
