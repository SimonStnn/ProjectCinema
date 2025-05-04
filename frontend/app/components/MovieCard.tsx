import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ClassValue } from "clsx";

import { cn } from "@/lib/utils";
import { Box, Rating, Typography } from "@mui/material";

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
  onClick: () => any;
}

const MovieCard = ({ movie, className, onClick }: MovieCardProps) => {
  // TMDB stores vote average as 0-10, convert to 0-5 for Rating component
  const rating = movie.vote_average / 2;

  // Generate image URL or use placeholder
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-poster.jpg";

  return (
    <Card className={cn("pt-0 overflow-hidden", className)} onClick={onClick}>
      <img src={imageUrl} alt={`${movie.title} poster`} />
      <CardContent>
        <CardTitle>{movie.title}</CardTitle>
        <CardDescription className="flex items-center">
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {rating.toFixed(1)}
          </Typography>
        </CardDescription>
        <p className="line-clamp-3">{movie.overview}</p>
      </CardContent>
    </Card>
  );
};

export default MovieCard;
