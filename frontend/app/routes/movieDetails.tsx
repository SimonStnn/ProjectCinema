import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Rating } from "@mui/material";
import {
  AccessTime as TimeIcon,
  CalendarMonth,
  EventSeat as SeatIcon,
  Warning,
  Add as AddIcon,
} from "@mui/icons-material";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

interface Showing {
  id: string;
  movie_id: number;
  room_id: string;
  start_time: string;
  end_time: string;
  price: number;
  room_name: string;
}

interface Room {
  id: string;
  name: string;
}

interface ShowingsByDate {
  [date: string]: Showing[];
}

interface AddShowingFormData {
  room_id: string;
  start_time: string;
  price: number;
}

const MovieDetailPage = () => {
  const { movie_id } = useParams<{ movie_id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState<AddShowingFormData>({
    room_id: "",
    start_time: "",
    price: 12.99,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [addingShowing, setAddingShowing] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Get authentication state
  const { isAdmin, token } = useAuthStore();

  // API URL from environment variables or fallback
  const API_URL =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
  const API_VERSION = "/api/v1"; // Match backend configuration

  // Group showings by date
  const showingsByDate: ShowingsByDate = {};
  showings.forEach((showing) => {
    // Get date part only
    const date = showing.start_time.split("T")[0];
    if (!showingsByDate[date]) {
      showingsByDate[date] = [];
    }
    showingsByDate[date].push(showing);
  });

  // Get unique dates for filtering
  const availableDates = Object.keys(showingsByDate).sort();

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
      console.log("Selected date set to:", availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Fetch available rooms for the dropdown in admin form
  useEffect(() => {
    if (isAdmin && showAddForm) {
      const fetchRooms = async () => {
        try {
          const response = await fetch(
            `${API_URL}${API_VERSION}/cinema/rooms`,
            {
              headers: {
                Authorization: `Bearer ${useAuthStore.getState().token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch rooms");
          }

          const data = await response.json();
          setRooms(data);
        } catch (err) {
          console.error("Failed to fetch rooms:", err);
          // Fallback to mock data if API call fails
          setRooms([
            { id: "550e8400-e29b-41d4-a716-446655440000", name: "Room 1" },
            { id: "550e8400-e29b-41d4-a716-446655440001", name: "Room 2" },
            {
              id: "550e8400-e29b-41d4-a716-446655440002",
              name: "IMAX Theater",
            },
          ]);
        }
      };

      fetchRooms();
    }
  }, [isAdmin, showAddForm, API_URL, API_VERSION]);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!movie_id) return;

      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch movie details - use by-tmdb-id endpoint since we're getting a TMDB ID from the URL
        const movieResponse = await fetch(
          `${API_URL}/api/v1/movies/tmdb/${movie_id}`
        );
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie: ${movieResponse.statusText}`);
        }

        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch showings for this movie
        const showingsResponse = await fetch(
          `${API_URL}/api/v1/showings?movie_id=${movie_id}`
        );
        if (!showingsResponse.ok) {
          throw new Error(
            `Failed to fetch showings: ${showingsResponse.statusText}`
          );
        }

        const showingsData = await showingsResponse.json();
        setShowings(showingsData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movie_id]);

  const handleDateChange = (event: any) => {
    setSelectedDate(event.target.value);
  };

  const handleBookingClick = (showingId: string) => {
    if (!movie_id) return;
    navigate(`/booking/${movie_id}/${showingId}`);
  };

  // Format minutes to hours and minutes
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format the showing time
  const formatShowtime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        date.toLocaleDateString([], { month: "2-digit", day: "2-digit" })
      );
    } catch (error) {
      return isoString;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddShowing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!movie_id || !movie) return;

    // Basic validation
    if (!formData.room_id || !formData.start_time || formData.price <= 0) {
      setFormError("Please fill all required fields with valid values");
      return;
    }

    try {
      setAddingShowing(true);
      setFormError(null);

      // Calculate end time based on movie runtime
      const startTime = new Date(formData.start_time);
      const endTime = new Date(startTime.getTime() + movie.runtime * 60 * 1000);

      // Now create the showing with the TMDB ID directly
      const response = await fetch(`${API_URL}${API_VERSION}/showings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          movie_id: parseInt(movie_id), // Use the TMDB ID directly
          room_id: formData.room_id,
          start_time: formData.start_time,
          end_time: endTime.toISOString(),
          price: formData.price,
          showing_status: "scheduled", // Updated parameter name to match backend
        }),
      });

      if (!response.ok) {
        // Get the error details for debugging
        const errorData = await response.json();
        console.error("Showing creation error:", errorData);
        throw new Error(errorData.detail || "Failed to add showing");
      }

      // Reset form and update UI
      setAddSuccess(true);
      setFormData({
        room_id: "",
        start_time: "",
        price: 12.99,
      });
      setShowAddForm(false);

      // Refresh showings list
      const showingsResponse = await fetch(
        `${API_URL}/api/v1/showings?movie_id=${movie_id}`
      );
      if (showingsResponse.ok) {
        const showingsData = await showingsResponse.json();
        setShowings(showingsData);
      }

      // Clear success message after delay
      setTimeout(() => {
        setAddSuccess(false);
      }, 5000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddingShowing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto mt-10 flex justify-center items-center"></div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto mt-10">
        <Alert variant="destructive" className="border-destructive">
          <Warning className="size-4" />
          <AlertTitle>Movie not found</AlertTitle>
          <AlertDescription className="flex justify-between">
            Please try again later.
            <Button variant="destructive" onClick={() => navigate("/movies")}>
              Back to Movies
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop Header */}
      <div
        className={cn(
          "relative h-[70dvh] bg-linear-to-b from-sky-700 to-sky-900"
          // movie.backdrop_path && `bg-[url(https://image.tmdb.org/t/p/original${movie.backdrop_path})] `
        )}
      >
        <img
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
          alt={`${movie.title} backdrop`}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="container mx-auto flex flex-col justify-end items-start h-full py-5 px-2 sm:px-0 text-white *:z-10 xl:flex-row xl:justify-start xl:gap-5 xl:items-end">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`${movie.title} poster`}
            className="h-[350px] rounded-lg shadow-lg object-cover invisible sm:visible"
          />
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>

            <div className="flex items-center mb-2" title="Rating">
              <Rating value={movie.vote_average / 2} precision={0.5} readOnly />
              <p className="ml-2 text-sm">
                {(movie.vote_average / 2).toFixed(1)} ({movie.vote_count}{" "}
                reviews)
              </p>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {movie.genres.map((genre) => (
                <Badge key={genre.id} variant="outline" className="text-white">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-1" title="Release Date">
                <CalendarMonth />
                <p>{new Date(movie.release_date).toDateString()}</p>
              </div>
              <div className="flex items-center gap-1" title="Runtime">
                <TimeIcon />
                <p>{formatRuntime(movie.runtime)}</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2">Overview</h3>
            <p className=" md:w-8/12">{movie.overview}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-10">
        <h2 className="text-3xl font-bold mb-4">Showings</h2>

        {/* Success message */}
        {addSuccess && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Showing has been added successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Date selector for showings */}
        {availableDates.length > 0 ? (
          <div className="mb-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-select">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarMonth className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(new Date(selectedDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = format(date, "yyyy-MM-dd");
                        // Only set if it's an available date
                        if (availableDates.includes(formattedDate)) {
                          setSelectedDate(formattedDate);
                        }
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates that don't have showings
                      const formattedDate = format(date, "yyyy-MM-dd");
                      return !availableDates.includes(formattedDate);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Display showings for selected date */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {selectedDate &&
                showingsByDate[selectedDate].map((showing) => (
                  <Card key={showing.id} className="flex flex-col h-full">
                    <CardContent className="flex-grow">
                      <p className="text-lg font-semibold mb-2">
                        {new Date(showing.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex items-center mb-2">
                        <SeatIcon fontSize="small" />
                        <p
                          className="ml-1 text-sm"
                          title={`Room: ${showing.room_name}`}
                        >
                          {showing.room_name}
                        </p>
                      </div>
                      <div className="flex items-center mb-2">
                        <p className="text-sm text-secondary-foreground">
                          Price: ${showing.price.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        className="mt-4 w-full"
                        onClick={() => handleBookingClick(showing.id)}
                      >
                        Book Tickets
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ) : (
          <Alert className="mb-4">
            <AlertTitle>No Showings Available</AlertTitle>
            <AlertDescription>
              There are currently no showings scheduled for this movie.
            </AlertDescription>
          </Alert>
        )}

        {/* Admin section for adding showings */}
        {isAdmin && (
          <div className="mt-8 border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Admin Actions</h3>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1"
              >
                <AddIcon fontSize="small" />
                {showAddForm ? "Cancel" : "Add New Showing"}
              </Button>
            </div>

            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Showing</CardTitle>
                  <CardDescription>
                    {formError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddShowing} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room_id">Select Room</Label>
                        <Select
                          name="room_id"
                          value={formData.room_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, room_id: value })
                          }
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                          <SelectContent className="w-full">
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <div className="flex flex-col gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? (
                                  format(date, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(selectedDate) => {
                                  setDate(selectedDate);
                                  if (selectedDate) {
                                    // Keep the time part from the existing value if it exists
                                    const existingTime =
                                      formData.start_time.split("T")[1] ||
                                      "12:00";
                                    const formattedDate = format(
                                      selectedDate,
                                      "yyyy-MM-dd"
                                    );
                                    const newDateTime = `${formattedDate}T${existingTime}`;
                                    setFormData({
                                      ...formData,
                                      start_time: newDateTime,
                                    });
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <Input
                            id="start_time"
                            name="start_time"
                            type="time"
                            value={formData.start_time.split("T")[1] || ""}
                            onChange={(e) => {
                              // Preserve the date part if it exists
                              const datePart = date
                                ? format(date, "yyyy-MM-dd")
                                : formData.start_time.split("T")[0] ||
                                  new Date().toISOString().split("T")[0];
                              const newDateTime = `${datePart}T${e.target.value}`;
                              setFormData({
                                ...formData,
                                start_time: newDateTime,
                              });
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Ticket Price ($)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingShowing}>
                        {addingShowing ? "Adding..." : "Add Showing"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MovieDetailPage;
