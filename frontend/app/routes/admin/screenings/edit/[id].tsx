import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Movie {
  id: number;
  title: string;
}

interface Room {
  id: string;
  name: string;
}

interface Screening {
  id: string;
  movie_id: number;
  room_id: string;
  start_time: string;
  end_time: string | null;
  price: number;
  room: string;
  available_tickets: number;
}

const formSchema = z.object({
  movie_id: z.string().min(1, "Please select a movie"),
  room_id: z.string().min(1, "Please select a room"),
  start_time: z.date({
    required_error: "Please select a start time and date",
  }),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  available_tickets: z.coerce
    .number()
    .min(0, "Available tickets cannot be negative"),
});

export default function EditScreening() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, isAdmin, token } = useAuthStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [screening, setScreening] = useState<Screening | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movie_id: "",
      room_id: "",
      price: 10.0,
      available_tickets: 0,
    },
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/login");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch screening, movies and rooms
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch screening
        const screeningResponse = await fetch(`${API_URL}/screenings/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!screeningResponse.ok) {
          throw new Error("Failed to fetch screening");
        }

        const screeningData = await screeningResponse.json();
        setScreening(screeningData);

        // Set form values
        form.setValue("movie_id", screeningData.movie_id.toString());
        form.setValue("room_id", screeningData.room_id);
        form.setValue("price", screeningData.price);
        form.setValue("available_tickets", screeningData.available_tickets);
        form.setValue("start_time", new Date(screeningData.start_time));

        // Fetch movies
        const moviesResponse = await fetch(`${API_URL}/movies`);
        if (!moviesResponse.ok) {
          throw new Error("Failed to fetch movies");
        }
        const moviesData = await moviesResponse.json();
        setMovies(moviesData);

        // Fetch rooms
        const roomsResponse = await fetch(`${API_URL}/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!roomsResponse.ok) {
          // If API doesn't have rooms endpoint yet, use mock data
          setRooms([
            { id: "1", name: "Room 1" },
            { id: "2", name: "Room 2" },
            { id: "3", name: "Room 3" },
          ]);
        } else {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load necessary data. Please try again later.");
        setLoading(false);

        // Fallback to mock data if API fails
        setRooms([
          { id: "1", name: "Room 1" },
          { id: "2", name: "Room 2" },
          { id: "3", name: "Room 3" },
        ]);
      }
    };

    fetchData();
  }, [token, id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token || !id) return;

    try {
      setLoading(true);
      setError(null);

      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

      // Calculate end time (assume 2 hours for simplicity, or keep original end time)
      let endTime;
      if (screening && screening.end_time) {
        // Keep original duration
        const originalStart = new Date(screening.start_time);
        const originalEnd = new Date(screening.end_time);
        const duration = originalEnd.getTime() - originalStart.getTime();

        endTime = new Date(values.start_time);
        endTime.setTime(endTime.getTime() + duration);
      } else {
        // Default to 2 hours
        endTime = new Date(values.start_time);
        endTime.setHours(endTime.getHours() + 2);
      }

      const response = await fetch(`${API_URL}/screenings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movie_id: parseInt(values.movie_id),
          room_id: values.room_id,
          start_time: values.start_time.toISOString(),
          end_time: endTime.toISOString(),
          price: values.price,
          available_tickets: values.available_tickets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update screening");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error updating screening:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update screening. Please try again."
      );
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Screening</CardTitle>
            <CardDescription>
              Update screening details and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading screening data...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="movie_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movie</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a movie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {movies.map((movie) => (
                              <SelectItem
                                key={movie.id}
                                value={movie.id.toString()}
                              >
                                {movie.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a room" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem
                                key={room.id}
                                value={room.id.toString()}
                              >
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={loading}
                              >
                                {field.value ? (
                                  format(field.value, "PPP p")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  // When calendar date is selected, keep the original time
                                  const currentTime = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  date.setHours(
                                    currentTime.getHours(),
                                    currentTime.getMinutes()
                                  );
                                  field.onChange(date);
                                }
                              }}
                              disabled={loading}
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <Input
                                type="time"
                                value={
                                  field.value
                                    ? `${field.value
                                        .getHours()
                                        .toString()
                                        .padStart(2, "0")}:${field.value
                                        .getMinutes()
                                        .toString()
                                        .padStart(2, "0")}`
                                    : ""
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }}
                                disabled={loading}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="10.00"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Price per ticket in dollars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="available_tickets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Tickets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of tickets available for this screening
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && <div className="text-red-500 text-sm">{error}</div>}

                  {success && (
                    <div className="text-green-500 text-sm">
                      Screening updated successfully! Redirecting...
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || success}
                  >
                    {loading ? "Updating..." : "Update Screening"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
