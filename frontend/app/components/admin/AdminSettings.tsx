import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
//   Paper,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Api as ApiIcon,
  MovieFilter as MovieIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../store/authStore";

interface AppSettings {
  tmdb_api_key: string;
  tmdb_api_url: string;
  enable_mqtt: boolean;
  mqtt_broker_url: string;
  mqtt_websocket_port: number;
  mqtt_topic_prefix: string;
  booking_expiration_minutes: number;
  payment_gateway: "stripe" | "paypal" | "mock";
  maintenance_mode: boolean;
  default_currency: string;
  seat_hold_timeout_seconds: number;
  sentry_dsn: string;
  enable_analytics: boolean;
  max_seats_per_booking: number;
}

const AdminSettings = () => {
  const { token } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings>({
    tmdb_api_key: "",
    tmdb_api_url: "https://api.themoviedb.org/3",
    enable_mqtt: true,
    mqtt_broker_url: "mqtt://localhost",
    mqtt_websocket_port: 9001,
    mqtt_topic_prefix: "cinema",
    booking_expiration_minutes: 15,
    payment_gateway: "mock",
    maintenance_mode: false,
    default_currency: "USD",
    seat_hold_timeout_seconds: 300,
    sentry_dsn: "",
    enable_analytics: false,
    max_seats_per_booking: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(`${API_URL}/api/v1/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }

        const data = await response.json();
        setSettings(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | { name?: string; value: unknown }
    >
  ) => {
    const target = event.target as HTMLInputElement;
    const name = target.name as keyof AppSettings;
    const value =
      target.type === "checkbox"
        ? target.checked
        : target.type === "number"
        ? Number(target.value)
        : target.value;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/api/v1/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }

      setSuccess("Settings saved successfully!");
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  const handleTestApiConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/api/v1/admin/settings/test-tmdb-connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            api_key: settings.tmdb_api_key,
            api_url: settings.tmdb_api_url,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.statusText}`);
      }

      setSuccess("TMDB API connection successful!");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
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
          Application Settings
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : "Save Settings"}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={success}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* TMDB API Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="TMDB API Settings"
                avatar={<MovieIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="tmdb_api_key"
                      label="TMDB API Key"
                      value={settings.tmdb_api_key}
                      onChange={handleChange}
                      fullWidth
                      required
                      type="password"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="tmdb_api_url"
                      label="TMDB API URL"
                      value={settings.tmdb_api_url}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<ApiIcon />}
                      onClick={handleTestApiConnection}
                    >
                      Test Connection
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* MQTT Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="Real-time Communication"
                avatar={<SettingsIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="enable_mqtt"
                          checked={settings.enable_mqtt}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="Enable Real-time Updates (MQTT)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="mqtt_broker_url"
                      label="MQTT Broker URL"
                      value={settings.mqtt_broker_url}
                      onChange={handleChange}
                      fullWidth
                      disabled={!settings.enable_mqtt}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="mqtt_websocket_port"
                      label="WebSocket Port"
                      type="number"
                      value={settings.mqtt_websocket_port}
                      onChange={handleChange}
                      fullWidth
                      disabled={!settings.enable_mqtt}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="mqtt_topic_prefix"
                      label="Topic Prefix"
                      value={settings.mqtt_topic_prefix}
                      onChange={handleChange}
                      fullWidth
                      disabled={!settings.enable_mqtt}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Booking Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="Booking Settings"
                avatar={<SecurityIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="booking_expiration_minutes"
                      label="Booking Expiration (minutes)"
                      type="number"
                      value={settings.booking_expiration_minutes}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="seat_hold_timeout_seconds"
                      label="Seat Hold Timeout (seconds)"
                      type="number"
                      value={settings.seat_hold_timeout_seconds}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{ inputProps: { min: 30 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="max_seats_per_booking"
                      label="Max Seats Per Booking"
                      type="number"
                      value={settings.max_seats_per_booking}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{ inputProps: { min: 1, max: 20 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="default_currency"
                      label="Default Currency"
                      value={settings.default_currency}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="Payment Settings"
                avatar={<PaymentIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="payment-gateway-label">
                        Payment Gateway
                      </InputLabel>
                      <Select
                        labelId="payment-gateway-label"
                        name="payment_gateway"
                        value={settings.payment_gateway}
                        label="Payment Gateway"
                        onChange={handleChange as any}
                      >
                        <MenuItem value="stripe">Stripe</MenuItem>
                        <MenuItem value="paypal">PayPal</MenuItem>
                        <MenuItem value="mock">Mock (Testing)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Settings */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="System Settings"
                avatar={<SettingsIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="maintenance_mode"
                          checked={settings.maintenance_mode}
                          onChange={handleChange}
                          color="warning"
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="enable_analytics"
                          checked={settings.enable_analytics}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="Enable Analytics"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="sentry_dsn"
                      label="Sentry DSN (Error Tracking)"
                      value={settings.sentry_dsn}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminSettings;
