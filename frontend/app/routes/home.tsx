import { useEffect, useState } from "react";
import type { Movie } from "@/types";
import type { Route } from "./+types/home";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import MovieCard from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Cinema" },
    {
      name: "description",
      content: "Demo cinema app for Vives by Simon Stijnen",
    },
  ];
}

export default function Home() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLoadingSkeleton = (amount: number = 10) => {
    return new Array(amount)
      .fill(0)
      .map((_, index) => <Skeleton key={index} className="h-96 w-full mb-4" />);
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        // Fetch featured (now playing) movies
        const featuredResponse = await fetch(
          `${API_URL}/api/v1/movies/now_playing`
        );

        // Fetch upcoming movies
        const upcomingResponse = await fetch(
          `${API_URL}/api/v1/movies/upcoming`
        );

        if (!featuredResponse.ok || !upcomingResponse.ok) {
          throw new Error("Failed to fetch movies");
        }

        const featuredData = await featuredResponse.json();
        const upcomingData = await upcomingResponse.json();

        setFeaturedMovies(featuredData || []);
        setUpcomingMovies(upcomingData || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="container mx-auto">
      <AspectRatio
        ratio={16 / 9}
        className="w-full bg-linear-to-br from-sky-600 to-sky-800 rounded-2xl overflow-hidden shadow-lg mt-10"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-4xl font-bold">
          <div>
            <p>
              Welcome to <br />
              <span className="font-mono text-primary">Project Cinema</span>
            </p>
            <p className="text-lg opacity-70">Discover the World of Movies</p>
          </div>
        </div>
      </AspectRatio>

      <h2 className="text-3xl font-bold my-3 mt-6">Now Playing</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <Carousel
        className="w-9/12 md:w-11/12 2xl:w-full m-auto"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {loading && getLoadingSkeleton(12)}
          {featuredMovies.map((movie) => (
            <CarouselItem
              key={movie.id}
              className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <Link to={`/movies/${movie.id}`}>
                <MovieCard
                  movie={movie}
                  className="w-full hover:scale-105 hover:-translate-y-3 transition-transform duration-200"
                  onClick={() => {}}
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <h2 className="text-3xl font-bold my-3 mt-6">Upcoming Movies</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading && getLoadingSkeleton(12)}
        {upcomingMovies.map((movie) => (
          <Link to={`/movies/${movie.id}`}>
            <MovieCard
              movie={movie}
              className="w-full hover:scale-105 hover:-translate-y-3 transition-transform duration-200"
              onClick={() => {}}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
