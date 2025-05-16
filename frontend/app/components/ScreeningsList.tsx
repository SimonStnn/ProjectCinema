import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AccessTime as TimeIcon,
  CalendarMonth,
  EventSeat as SeatIcon,
  ArrowForward,
  ConfirmationNumber,
} from "@mui/icons-material";

interface Screening {
  id: string;
  movie_id: number;
  start_time: string;
  end_time: string | null;
  price: number;
  room: string;
  available_tickets: number;
}

interface ScreeningsListProps {
  movieId: number;
  screenings: Screening[];
  isLoading: boolean;
}

export default function ScreeningsList({
  movieId,
  screenings,
  isLoading,
}: ScreeningsListProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleReserveClick = (screeningId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=reserve/${screeningId}`);
    } else {
      navigate(`/reserve/${screeningId}`);
    }
  };

  // Group screenings by date
  const screeningsByDate = screenings.reduce<Record<string, Screening[]>>(
    (acc, screening) => {
      const date = format(new Date(screening.start_time), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(screening);
      return acc;
    },
    {}
  );

  // Sort screenings by time within each date group
  Object.keys(screeningsByDate).forEach((date) => {
    screeningsByDate[date].sort((a, b) => {
      return (
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
  });

  // Get unique dates
  const dates = Object.keys(screeningsByDate).sort();

  // Set default selected date to first date if none selected
  if (dates.length > 0 && !selectedDate) {
    setSelectedDate(dates[0]);
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p>Loading screenings...</p>
      </div>
    );
  }

  if (screenings.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">
            No screenings available for this movie.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex flex-wrap gap-2">
        {dates.map((date) => (
          <Button
            key={date}
            variant={selectedDate === date ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDate(date)}
            className="flex items-center"
          >
            <CalendarMonth className="mr-1 h-4 w-4" />
            {format(new Date(date), "EEE, MMM d")}
          </Button>
        ))}
      </div>

      {/* Screenings for selected date */}
      {selectedDate && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            Screenings for {format(new Date(selectedDate), "EEEE, MMMM d")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {screeningsByDate[selectedDate]?.map((screening) => (
              <Card key={screening.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <TimeIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(screening.start_time), "h:mm a")}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      Room {screening.room}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-sm">
                      <SeatIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                      {screening.available_tickets > 0 ? (
                        <span>{screening.available_tickets} available</span>
                      ) : (
                        <span className="text-red-500">Sold out</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold">
                      ${screening.price.toFixed(2)}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleReserveClick(screening.id)}
                    disabled={screening.available_tickets === 0}
                    className="w-full flex items-center justify-center"
                    size="sm"
                  >
                    <ConfirmationNumber className="mr-1 h-4 w-4" />
                    {screening.available_tickets > 0 ? "Reserve" : "Sold Out"}
                    {screening.available_tickets > 0 && (
                      <ArrowForward className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
