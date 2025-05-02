import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import {
  Movie as MovieIcon,
  People as PeopleIcon,
  ConfirmationNumber as TicketIcon,
  TheaterComedy as CinemaIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useAuthStore } from "../../store/authStore";
import { Link as RouterLink } from "react-router";

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

interface RecentBooking {
  id: string;
  user_name: string;
  movie_title: string;
  cinema_name: string;
  showing_time: string;
  seats: string[];
  total_price: number;
  booking_date: string;
}

const AdminDashboardHome = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalCinemas: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch dashboard stats
        const statsResponse = await fetch(
          `${API_URL}/api/v1/admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Fetch recent bookings
        const bookingsResponse = await fetch(
          `${API_URL}/api/v1/admin/dashboard/recent-bookings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!statsResponse.ok || !bookingsResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const statsData = await statsResponse.json();
        const bookingsData = await bookingsResponse.json();

        setStats(statsData);
        setRecentBookings(bookingsData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const statCards: StatCard[] = [
    {
      title: "Total Movies",
      value: stats.totalMovies,
      icon: <MovieIcon fontSize="large" />,
      color: "#3f51b5",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <PeopleIcon fontSize="large" />,
      color: "#2196f3",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: <TicketIcon fontSize="large" />,
      color: "#4caf50",
    },
    {
      title: "Total Cinemas",
      value: stats.totalCinemas,
      icon: <CinemaIcon fontSize="large" />,
      color: "#ff9800",
    },
  ];

  // Format date for displaying
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPp");
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              sx={{
                height: "100%",
                borderTop: `4px solid ${card.color}`,
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 5,
                },
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    color: card.color,
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h5" component="div">
                  {card.value}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                ${stats.revenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h2">
            Recent Bookings
          </Typography>
          <Button
            component={RouterLink}
            to="/admin/bookings"
            variant="outlined"
            size="small"
          >
            View All
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="recent bookings">
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Movie</TableCell>
                <TableCell>Cinema</TableCell>
                <TableCell>Seats</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No recent bookings found
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>{booking.id.substring(0, 8)}</TableCell>
                    <TableCell>{booking.user_name}</TableCell>
                    <TableCell>{booking.movie_title}</TableCell>
                    <TableCell>{booking.cinema_name}</TableCell>
                    <TableCell>{booking.seats.join(", ")}</TableCell>
                    <TableCell>${booking.total_price.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(booking.booking_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default AdminDashboardHome;
