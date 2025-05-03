import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  AccountCircle as AccountIcon,
  ConfirmationNumber as TicketIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";
import { format } from "date-fns";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface Booking {
  id: string;
  movie_title: string;
  poster_path: string | null;
  room_name: string;
  showing_time: string;
  seats: string[];
  total_price: number;
  booking_date: string;
  status: "upcoming" | "past" | "cancelled";
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cinemaName = "Grand Cinema"; // Static cinema name

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/api/v1/bookings/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${useAuthStore.getState().token}`,
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
  }, [user, navigate]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const upcomingBookings = bookings.filter(
    (booking) => booking.status === "upcoming"
  );
  const pastBookings = bookings.filter(
    (booking) => booking.status === "past" || booking.status === "cancelled"
  );

  // Format ISO date to readable format
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return isoString;
    }
  };

  if (!user) {
    // This shouldn't normally be visible as we navigate away in useEffect
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">Please log in to view your profile.</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/login")}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{ width: 120, height: 120, mb: 2, bgcolor: "primary.main" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  display: "inline-block",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  mt: 1,
                }}
              >
                {user.role === "admin" ? "Admin" : "Member"}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List component="nav">
              <ListItem button sx={{ borderRadius: 1 }}>
                <AccountIcon sx={{ mr: 2 }} />
                <ListItemText primary="My Account" />
              </ListItem>
              <ListItem
                button
                sx={{ borderRadius: 1 }}
                onClick={() => setTabValue(0)}
              >
                <TicketIcon sx={{ mr: 2 }} />
                <ListItemText primary="My Bookings" />
              </ListItem>
              <ListItem
                button
                sx={{ borderRadius: 1 }}
                onClick={() => setTabValue(1)}
              >
                <HistoryIcon sx={{ mr: 2 }} />
                <ListItemText primary="Booking History" />
              </ListItem>
              <ListItem button sx={{ borderRadius: 1 }}>
                <EditIcon sx={{ mr: 2 }} />
                <ListItemText primary="Edit Profile" />
              </ListItem>
              <ListItem button sx={{ borderRadius: 1 }} onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2 }} />
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="profile tabs"
              >
                <Tab label="Upcoming Bookings" id="profile-tab-0" />
                <Tab label="Booking History" id="profile-tab-1" />
              </Tabs>
            </Box>

            {/* Upcoming Bookings Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Your Upcoming Bookings
              </Typography>

              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 4,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ my: 2 }}>
                  {error}
                </Alert>
              ) : upcomingBookings.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    You don't have any upcoming bookings.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/movies")}
                  >
                    Browse Movies
                  </Button>
                </Box>
              ) : (
                <Box>
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} sx={{ mb: 3, borderRadius: 2 }}>
                      <Grid container>
                        <Grid item xs={12} sm={4}>
                          <CardMedia
                            component="img"
                            height="100%"
                            image={
                              booking.poster_path
                                ? `https://image.tmdb.org/t/p/w500${booking.poster_path}`
                                : "/placeholder-poster.jpg"
                            }
                            alt={booking.movie_title}
                            sx={{
                              height: { xs: "200px", sm: "100%" },
                              objectFit: "cover",
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {booking.movie_title}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Typography variant="body1">
                                <strong>Date & Time:</strong>{" "}
                                {formatDate(booking.showing_time)}
                              </Typography>
                              <Typography variant="body1">
                                <strong>Venue:</strong> {cinemaName} (
                                {booking.room_name})
                              </Typography>
                              <Typography variant="body1">
                                <strong>Seats:</strong>{" "}
                                {booking.seats.join(", ")}
                              </Typography>
                              <Typography variant="body1">
                                <strong>Booking Reference:</strong>{" "}
                                {booking.id.substring(0, 8).toUpperCase()}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                // Navigate to ticket details
                                navigate(`/bookings/${booking.id}`);
                              }}
                            >
                              View Tickets
                            </Button>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              )}
            </TabPanel>

            {/* Booking History Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Your Booking History
              </Typography>

              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 4,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ my: 2 }}>
                  {error}
                </Alert>
              ) : pastBookings.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    You don't have any past bookings.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {pastBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        opacity: booking.status === "cancelled" ? 0.7 : 1,
                      }}
                    >
                      <Grid container>
                        <Grid item xs={12} sm={4}>
                          <CardMedia
                            component="img"
                            height="100%"
                            image={
                              booking.poster_path
                                ? `https://image.tmdb.org/t/p/w500${booking.poster_path}`
                                : "/placeholder-poster.jpg"
                            }
                            alt={booking.movie_title}
                            sx={{
                              height: { xs: "200px", sm: "100%" },
                              objectFit: "cover",
                              filter:
                                booking.status === "cancelled"
                                  ? "grayscale(1)"
                                  : "none",
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography variant="h6">
                                {booking.movie_title}
                              </Typography>
                              {booking.status === "cancelled" && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    display: "inline-block",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: "error.light",
                                    color: "error.dark",
                                  }}
                                >
                                  Cancelled
                                </Typography>
                              )}
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Typography variant="body1">
                                <strong>Date & Time:</strong>{" "}
                                {formatDate(booking.showing_time)}
                              </Typography>
                              <Typography variant="body1">
                                <strong>Venue:</strong> {cinemaName} (
                                {booking.room_name})
                              </Typography>
                              <Typography variant="body1">
                                <strong>Seats:</strong>{" "}
                                {booking.seats.join(", ")}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Booked on {formatDate(booking.booking_date)}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                // Navigate to movie page
                                navigate(`/movies/${booking.id}`);
                              }}
                            >
                              Movie Details
                            </Button>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
