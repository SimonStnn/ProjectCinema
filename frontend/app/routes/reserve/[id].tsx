import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  EventSeat as SeatIcon,
  CreditCard,
  Warning,
} from "@mui/icons-material";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface Screening {
  id: string;
  movie_id: number;
  movie_title: string;
  start_time: string;
  end_time: string | null;
  price: number;
  room: string;
  available_tickets: number;
}

export default function ReservationPage() {
  const { id } = useParams(); // Screening ID
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [screening, setScreening] = useState<Screening | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCVV, setCardCVV] = useState<string>("");
  const [reserving, setReserving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=reserve/" + id);
    }
  }, [isAuthenticated, id, navigate]);

  // Fetch screening details
  useEffect(() => {
    const fetchScreening = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/screenings/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch screening details");
        }

        const data = await response.json();
        setScreening(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching screening:", err);
        setError("Failed to load screening details. Please try again later.");
        setLoading(false);
      }
    };

    fetchScreening();
  }, [token, id]);

  const handleReserve = async () => {
    if (!token || !screening) return;

    try {
      setReserving(true);
      setPaymentError(null);

      // Validate form
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim()) {
        setPaymentError("Please fill in all payment details");
        setReserving(false);
        return;
      }

      // Simple card number validation
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        setPaymentError("Please enter a valid 16-digit card number");
        setReserving(false);
        return;
      }

      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screening_id: screening.id,
          ticket_count: ticketCount,
          // Payment details would normally be handled by a payment processor,
          // not sent directly to the backend in a real application
          payment_method: {
            type: "credit_card",
            card_number: cardNumber.replace(/\s/g, ""),
            card_expiry: cardExpiry,
            card_cvv: cardCVV,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reserve tickets");
      }

      // Successfully reserved
      setSuccess(true);
      setTimeout(() => {
        navigate("/profile/tickets");
      }, 3000);
    } catch (err) {
      console.error("Error reserving tickets:", err);
      setPaymentError(
        err instanceof Error
          ? err.message
          : "Failed to reserve tickets. Please try again."
      );
    } finally {
      setReserving(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format with spaces after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Reserve Tickets</CardTitle>
            <CardDescription>Complete your ticket reservation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p>Loading screening details...</p>
            ) : error ? (
              <Alert variant="destructive">
                <Warning className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : screening ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {screening.movie_title}
                  </h2>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {format(
                        new Date(screening.start_time),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </span>
                    <span className="mx-2">•</span>
                    <span>
                      {format(new Date(screening.start_time), "h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Room:</span>
                    <span className="ml-1">{screening.room}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium">Price:</span>
                    <span className="ml-1">
                      ${screening.price.toFixed(2)}/ticket
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <SeatIcon className="mr-1 h-4 w-4" />
                    <span className="font-medium">Available:</span>
                    <span className="ml-1">
                      {screening.available_tickets} tickets
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-count">Number of Tickets</Label>
                  <Select
                    value={ticketCount.toString()}
                    onValueChange={(value) => setTicketCount(parseInt(value))}
                    disabled={reserving || screening.available_tickets === 0}
                  >
                    <SelectTrigger id="ticket-count">
                      <SelectValue placeholder="Select number of tickets" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: Math.min(10, screening.available_tickets) },
                        (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i === 0 ? "ticket" : "tickets"} ($
                            {((i + 1) * screening.price).toFixed(2)})
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {screening.available_tickets === 0 && (
                  <Alert variant="destructive">
                    <Warning className="h-4 w-4" />
                    <AlertTitle>Sold Out</AlertTitle>
                    <AlertDescription>
                      There are no more tickets available for this screening.
                    </AlertDescription>
                  </Alert>
                )}

                {screening.available_tickets > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                        disabled={reserving}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="card-expiry">Expiry Date</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatExpiry(e.target.value))
                          }
                          maxLength={5}
                          disabled={reserving}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          value={cardCVV}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setCardCVV(value.slice(0, 3));
                          }}
                          maxLength={3}
                          disabled={reserving}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && (
                  <Alert variant="destructive">
                    <Warning className="h-4 w-4" />
                    <AlertTitle>Payment Error</AlertTitle>
                    <AlertDescription>{paymentError}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertTitle>Reservation Complete!</AlertTitle>
                    <AlertDescription>
                      Your tickets have been successfully reserved. Redirecting
                      to your tickets...
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : null}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={reserving}
            >
              Cancel
            </Button>
            {screening && screening.available_tickets > 0 && (
              <Button
                onClick={handleReserve}
                disabled={reserving || success}
                className="flex items-center"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {reserving
                  ? "Processing..."
                  : `Pay $${(ticketCount * screening.price).toFixed(2)}`}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
