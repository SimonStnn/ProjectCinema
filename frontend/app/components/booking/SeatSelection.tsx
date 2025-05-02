import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { WeekendOutlined as SeatIcon } from "@mui/icons-material";
import { useNavigate } from "react-router";

import {
  useMqttStore,
  subscribeToShowing,
  unsubscribeFromShowing,
  sendBookingRequest,
} from "../../services/mqttService";

interface SeatSelectionProps {
  showingId: string;
  movieTitle: string;
  showtime: string;
  cinemaName: string;
  roomName: string;
  price: number;
  userId: string;
}

// Seat status types
type SeatStatus =
  | "available"
  | "selected"
  | "booked"
  | "accessible"
  | "userSelected";

interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  isAccessible: boolean;
  price: number;
}

// Generate sample seats for development - in production would come from API
const generateSampleSeats = (): Seat[] => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seatsPerRow = 12;
  const seats: Seat[] = [];

  rows.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      const isAccessible = row === "H" && (i === 1 || i === 2);
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        status: isAccessible ? "accessible" : "available",
        isAccessible,
        price: isAccessible ? 15 : 12, // Premium pricing for accessible seats
      });
    }
  });

  return seats;
};

const SeatSelection: React.FC<SeatSelectionProps> = ({
  showingId,
  movieTitle,
  showtime,
  cinemaName,
  roomName,
  // price, // Used in generating seats with correct pricing
  userId,
}) => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>(generateSampleSeats());
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Access MQTT store state
  const {
    connected,
    seatUpdates,
    bookingSuccess,
    bookingError,
    clearBookingStatus,
  } = useMqttStore();

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // Handle MQTT seat updates
  useEffect(() => {
    if (seatUpdates.length > 0) {
      setSeats((prevSeats) => {
        const newSeats = [...prevSeats];

        seatUpdates.forEach((update) => {
          if (update.showingId === showingId) {
            const seatIndex = newSeats.findIndex(
              (seat) => seat.id === update.seatId
            );
            if (seatIndex !== -1) {
              newSeats[seatIndex] = {
                ...newSeats[seatIndex],
                status: update.status as SeatStatus,
              };
            }
          }
        });

        return newSeats;
      });
    }
  }, [seatUpdates, showingId]);

  // Handle booking response
  useEffect(() => {
    if (bookingSuccess !== null) {
      setLoading(false);

      if (bookingSuccess) {
        setBookingComplete(true);
        // Clear selected seats after successful booking
        setSelectedSeats([]);
      } else if (bookingError) {
        setError(bookingError);
      }

      // Clear booking status after handling
      clearBookingStatus();
    }
  }, [bookingSuccess, bookingError, clearBookingStatus]);

  // Subscribe to showing updates on mount
  useEffect(() => {
    if (connected) {
      subscribeToShowing(showingId);

      // Cleanup on unmount
      return () => {
        unsubscribeFromShowing(showingId);
      };
    }
  }, [connected, showingId]);

  // Handle seat click
  const handleSeatClick = (clickedSeat: Seat) => {
    // Can't select booked seats
    if (clickedSeat.status === "booked") {
      return;
    }

    setSeats((prevSeats) => {
      return prevSeats.map((seat) => {
        if (seat.id === clickedSeat.id) {
          // Toggle selection
          const newStatus =
            seat.status === "userSelected"
              ? seat.isAccessible
                ? "accessible"
                : "available"
              : "userSelected";

          // Update selectedSeats state
          if (newStatus === "userSelected") {
            setSelectedSeats((prev) => [...prev, seat]);
          } else {
            setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
          }

          return {
            ...seat,
            status: newStatus,
          };
        }
        return seat;
      });
    });
  };

  // Handle booking confirmation
  const handleBookingConfirm = () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);

    // Send booking request via MQTT
    sendBookingRequest({
      userId,
      showingId,
      seats: selectedSeats.map((seat) => seat.id),
    });
  };

  // Render a seat with appropriate styling based on status
  const renderSeat = (seat: Seat) => {
    let backgroundColor = "#E0E0E0"; // available
    let color = "#424242";
    let disabled = false;

    switch (seat.status) {
      case "userSelected":
        backgroundColor = "#4CAF50"; // green
        color = "white";
        break;
      case "selected":
        backgroundColor = "#FFC107"; // amber
        color = "black";
        disabled = true;
        break;
      case "booked":
        backgroundColor = "#F44336"; // red
        color = "white";
        disabled = true;
        break;
      case "accessible":
        backgroundColor = "#2196F3"; // blue
        color = "white";
        break;
    }

    return (
      <Paper
        elevation={3}
        sx={{
          backgroundColor,
          color,
          height: "40px",
          width: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          transition: "all 0.2s ease",
        }}
        onClick={() => !disabled && handleSeatClick(seat)}
      >
        <SeatIcon fontSize="small" />
      </Paper>
    );
  };

  // Group seats by row for display
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Select Your Seats
      </Typography>

      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h6">{movieTitle}</Typography>
        <Typography variant="subtitle1">
          {cinemaName} | {roomName} | {showtime}
        </Typography>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
        <Chip label="Available" sx={{ backgroundColor: "#E0E0E0" }} />
        <Chip
          label="Your Selection"
          sx={{ backgroundColor: "#4CAF50", color: "white" }}
        />
        <Chip label="Selected by Others" sx={{ backgroundColor: "#FFC107" }} />
        <Chip
          label="Booked"
          sx={{ backgroundColor: "#F44336", color: "white" }}
        />
        <Chip
          label="Accessible"
          sx={{ backgroundColor: "#2196F3", color: "white" }}
        />
      </Box>

      {/* Screen */}
      <Box
        sx={{
          height: "20px",
          backgroundColor: "#BDBDBD",
          width: "80%",
          mx: "auto",
          mb: 5,
          borderRadius: "4px",
          textAlign: "center",
          fontSize: "12px",
          color: "#424242",
        }}
      >
        SCREEN
      </Box>

      {/* Seat grid */}
      <Box sx={{ mb: 4 }}>
        {Object.keys(seatsByRow).map((row) => (
          <Grid
            container
            key={row}
            spacing={1}
            sx={{
              mb: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Grid item xs={1} sx={{ textAlign: "center" }}>
              <Typography variant="body2">{row}</Typography>
            </Grid>

            <Grid item xs={10}>
              <Grid container spacing={1} justifyContent="center">
                {seatsByRow[row].map((seat) => (
                  <Grid item key={seat.id}>
                    {renderSeat(seat)}
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={1} sx={{ textAlign: "center" }}>
              <Typography variant="body2">{row}</Typography>
            </Grid>
          </Grid>
        ))}
      </Box>

      {/* Summary and booking */}
      <Box
        sx={{
          p: 3,
          border: "1px solid #E0E0E0",
          borderRadius: 2,
          maxWidth: "500px",
          mx: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Booking Summary
        </Typography>

        {selectedSeats.length > 0 ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">Selected Seats:</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {selectedSeats.map((seat) => (
                  <Chip
                    key={seat.id}
                    label={`${seat.row}${seat.number}`}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Typography variant="body1" gutterBottom>
              Total: <strong>${totalPrice.toFixed(2)}</strong>
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || !connected}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Continue to Payment"
              )}
            </Button>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Please select at least one seat to continue.
          </Typography>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to book {selectedSeats.length} seat(s) for{" "}
            {movieTitle}. Total amount: ${totalPrice.toFixed(2)}. Would you like
            to proceed to payment?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBookingConfirm}
            variant="contained"
            color="primary"
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Complete Dialog */}
      <Dialog
        open={bookingComplete}
        onClose={() => {
          setBookingComplete(false);
          navigate("/bookings");
        }}
      >
        <DialogTitle>Booking Successful</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your seats for {movieTitle} have been successfully booked. You can
            view your booking details in your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBookingComplete(false);
              navigate("/bookings");
            }}
            variant="contained"
            color="primary"
          >
            View My Bookings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeatSelection;
