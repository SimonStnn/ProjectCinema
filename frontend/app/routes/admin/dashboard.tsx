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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, Edit, Trash } from "lucide-react";
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, token } = useAuthStore();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/login");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch all screenings
  useEffect(() => {
    const fetchScreenings = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/screenings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch screenings");
        }

        const data = await response.json();
        setScreenings(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching screenings:", err);
        setError("Failed to load screenings. Please try again later.");
        setLoading(false);
      }
    };

    fetchScreenings();
  }, [token]);

  const handleDeleteScreening = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this screening?"))
      return;

    try {
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/screenings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete screening");
      }

      // Remove deleted screening from state
      setScreenings(screenings.filter((screening) => screening.id !== id));
    } catch (err) {
      console.error("Error deleting screening:", err);
      setError("Failed to delete screening. Please try again.");
    }
  };

  const handleEditScreening = (id: string) => {
    navigate(`/admin/screenings/edit/${id}`);
  };

  const handleAddScreening = () => {
    navigate("/admin/screenings/add");
  };

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <Button onClick={handleAddScreening}>Add New Screening</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Screenings Management</CardTitle>
          <CardDescription>
            Manage cinema screenings, capacity, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading screenings...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : screenings.length === 0 ? (
            <p>No screenings found. Add your first screening!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available Tickets</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screenings.map((screening) => {
                  const startDate = new Date(screening.start_time);

                  return (
                    <TableRow key={screening.id}>
                      <TableCell className="font-medium">
                        {screening.movie_title}
                      </TableCell>
                      <TableCell>{screening.room}</TableCell>
                      <TableCell>{format(startDate, "PPP")}</TableCell>
                      <TableCell>{format(startDate, "p")}</TableCell>
                      <TableCell>${screening.price.toFixed(2)}</TableCell>
                      <TableCell>{screening.available_tickets}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditScreening(screening.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteScreening(screening.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
