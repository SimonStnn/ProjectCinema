import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  // Chip,
} from "@mui/material";
import { type ClassValue } from "clsx";
import {
  format,
  // parseISO
} from "date-fns";
import { cn } from "~/lib/utils";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

interface MovieCardProps {
  movie: Movie;
  className?: ClassValue;
  onClick: () => void;
}

const MovieCard = ({ movie, className, onClick }: MovieCardProps) => {
  // Format release date
  const formattedDate = movie.release_date
    ? format(new Date(movie.release_date), "MMM d, yyyy")
    : "Coming Soon";

  // TMDB stores vote average as 0-10, convert to 0-5 for Rating component
  const rating = movie.vote_average / 2;

  // Generate image URL or use placeholder
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-poster.jpg";

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 6,
          cursor: "pointer",
        },
      }}
      onClick={onClick}
      className={cn("w-60", className)}
    >
      <CardMedia
        component="img"
        height="300"
        image={imageUrl}
        alt={movie.title}
        sx={{ objectFit: "cover" }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="div" gutterBottom noWrap>
          {movie.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {rating.toFixed(1)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formattedDate}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {movie.overview}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MovieCard;
