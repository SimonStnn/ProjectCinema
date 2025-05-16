import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  EventSeat as SeatIcon,
  AccessTime as TimeIcon,
  CalendarMonth,
  Theaters,
  ConfirmationNumber,
  Warning,
  QrCode2,
} from "@mui/icons-material";
import { format } from "date-fns";

interface Ticket {
  id: string;
  screening_id: string;
  user_id: string;
  movie_title: string;
  room: string;
  start_time: string;
  seat_count: number;
  status: "reserved" | "used" | "cancelled";
  price: number;
  purchase_date: string;
  qr_code: string;
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=profile/tickets");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tickets");
        }

        const data = await response.json();
        setTickets(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Failed to load your tickets. Please try again later.");
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reserved":
        return "bg-green-100 text-green-800 border-green-200";
      case "used":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    // Sort by date (newest first) and status
    const dateA = new Date(a.start_time);
    const dateB = new Date(b.start_time);

    // If status is different, show reserved tickets first
    if (a.status !== b.status) {
      if (a.status === "reserved") return -1;
      if (b.status === "reserved") return 1;
    }

    // Otherwise sort by date
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">
            Manage your cinema ticket reservations
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading your tickets...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Theaters className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
              <p className="text-muted-foreground mb-6">
                You haven't reserved any movie tickets yet.
              </p>
              <Button onClick={() => navigate("/movies")}>Browse Movies</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-primary/5 p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-border">
                    <QrCode2 className="h-24 w-24 text-primary mb-2" />
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(
                        ticket.status
                      )} uppercase text-xs font-semibold`}
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <div className="md:w-3/4 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h3 className="text-xl font-bold">
                        {ticket.movie_title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="mt-1 md:mt-0 flex items-center"
                      >
                        <ConfirmationNumber className="mr-1 h-3 w-3" />
                        <span>
                          {ticket.seat_count}{" "}
                          {ticket.seat_count === 1 ? "ticket" : "tickets"}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm">
                        <CalendarMonth className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(ticket.start_time),
                            "EEEE, MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TimeIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(ticket.start_time), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Theaters className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Room: {ticket.room}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <SeatIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          Total: $
                          {(ticket.price * ticket.seat_count).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {ticket.status === "reserved" && (
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" className="mr-2">
                          Exchange
                        </Button>
                        <Button variant="destructive">
                          Cancel Reservation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
