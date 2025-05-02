import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from "@mui/material";
import {
  CreditCard as CardIcon,
  Payment as PaymentIcon,
  ConfirmationNumber as TicketIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";

interface BookingDetails {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  showingId: string;
  cinemaName: string;
  roomName: string;
  showtime: string;
  seats: string[];
  totalPrice: number;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState(0);

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardHolder: user?.name || "",
    expiryDate: "",
    cvv: "",
    saveCard: false,
  });

  const steps = ["Select Seats", "Payment Details", "Confirmation"];

  useEffect(() => {
    // In a real app, this would come from previous booking step via state or context
    // For demo, we'll use mock data from location state or hardcoded fallback
    if (location.state?.bookingDetails) {
      setBookingDetails(location.state.bookingDetails);
    } else {
      // Mock data for testing
      setBookingDetails({
        movieId: 123,
        movieTitle: "Example Movie",
        posterPath: null,
        showingId: "showing123",
        cinemaName: "Cinema City",
        roomName: "Room 1",
        showtime: "May 5, 2025, 7:30 PM",
        seats: ["A1", "A2"],
        totalPrice: 24.0,
      });
    }
  }, [location.state]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    setPaymentInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bookingDetails) return;

    setLoading(true);
    setError(null);

    try {
      // In a real app, this would make an API call to process payment
      // For demo, we'll simulate a successful payment after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // API URL from environment variables or fallback
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      // Finalize booking with backend
      const response = await fetch(`${API_URL}/api/v1/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          showing_id: bookingDetails.showingId,
          seats: bookingDetails.seats,
          payment_method: "credit_card",
          total_price: bookingDetails.totalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }

      // Handle successful payment
      setSuccess(true);
      setActiveStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment processing failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewTickets = () => {
    navigate("/profile");
  };

  if (!bookingDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Payment Form */}
          <Grid item xs={12} md={8}>
            {success ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                    color: "success.main",
                  }}
                >
                  <TicketIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Payment Successful!
                </Typography>
                <Typography variant="body1" paragraph>
                  Your booking has been confirmed. You can view your tickets in
                  your profile.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleViewTickets}
                  sx={{ mt: 2 }}
                >
                  View My Tickets
                </Button>
              </Box>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Card Number"
                      name="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      InputProps={{
                        startAdornment: <CardIcon sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Card Holder Name"
                      name="cardHolder"
                      value={paymentInfo.cardHolder}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Expiry Date"
                      name="expiryDate"
                      value={paymentInfo.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="CVV"
                      name="cvv"
                      value={paymentInfo.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={paymentInfo.saveCard}
                          onChange={handleInputChange}
                          name="saveCard"
                          color="primary"
                        />
                      }
                      label="Save this card for future purchases"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <PaymentIcon />
                        )
                      }
                    >
                      {loading ? "Processing..." : "Pay Now"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={
                      bookingDetails.posterPath
                        ? `https://image.tmdb.org/t/p/w92${bookingDetails.posterPath}`
                        : "/placeholder-poster.jpg"
                    }
                    alt={bookingDetails.movieTitle}
                    sx={{
                      width: "60px",
                      height: "90px",
                      borderRadius: 1,
                      mr: 2,
                      objectFit: "cover",
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle1">
                      {bookingDetails.movieTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {bookingDetails.cinemaName} | {bookingDetails.roomName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {bookingDetails.showtime}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Selected Seats:
                </Typography>
                <Typography variant="body2" paragraph>
                  {bookingDetails.seats.join(", ")}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1">Ticket Price:</Typography>
                  <Typography variant="body1">
                    $
                    {(
                      bookingDetails.totalPrice / bookingDetails.seats.length
                    ).toFixed(2)}{" "}
                    x {bookingDetails.seats.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1">Booking Fee:</Typography>
                  <Typography variant="body1">$1.50</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">
                    ${(bookingDetails.totalPrice + 1.5).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate(-1)}
              disabled={loading || success}
            >
              Back
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CheckoutPage;
