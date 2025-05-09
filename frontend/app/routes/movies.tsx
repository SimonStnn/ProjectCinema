import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

const MovieListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(
    queryParams.get("query") || ""
  );
  const [category, setCategory] = useState(
    queryParams.get("category") || "now_playing"
  );
  const [sortBy, setSortBy] = useState(
    queryParams.get("sort") || "popularity.desc"
  );
  const [page, setPage] = useState(
    parseInt(queryParams.get("page") || "1", 10)
  );
  const [totalPages, setTotalPages] = useState(1);

  // Category options
  const categories = [
    { value: "now_playing", label: "Now Playing" },
    { value: "upcoming", label: "Coming Soon" },
    { value: "popular", label: "Popular" },
    { value: "top_rated", label: "Top Rated" },
  ];

  // Sort options
  const sortOptions = [
    { value: "popularity.desc", label: "Popularity (High to Low)" },
    { value: "popularity.asc", label: "Popularity (Low to High)" },
    { value: "vote_average.desc", label: "Rating (High to Low)" },
    { value: "vote_average.asc", label: "Rating (Low to High)" },
    { value: "release_date.desc", label: "Release Date (Newest)" },
    { value: "release_date.asc", label: "Release Date (Oldest)" },
  ];

  // Update query parameters in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (category) params.set("category", category);
    if (sortBy) params.set("sort", sortBy);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchQuery, category, sortBy, page, location.pathname]);

  // Fetch movies based on filters
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL from environment variables or fallback
        const API_URL =
          (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

        let endpoint;
        let queryString = `?page=${page}&sort_by=${sortBy}`;

        if (searchQuery) {
          endpoint = "search";
          queryString += `&query=${encodeURIComponent(searchQuery)}`;
        } else {
          endpoint = category;
        }

        const response = await fetch(
          `${API_URL}/api/v1/movies/${endpoint}${queryString}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch movies: ${response.statusText}`);
        }

        const data = await response.json();
        setMovies(data || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, category, sortBy, page]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Trigger search by updating state which triggers useEffect
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1); // Reset to first page on category change
    setSearchQuery(""); // Clear search when changing category
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMovieClick = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className="container mx-auto">
      {/* Filters Section */}
      <div className="flex justify-between gap-4 mt-3 mb-6">
        <h1 className="text-center text-2xl font-bold mb-4">
          {searchQuery
            ? `Search Results: "${searchQuery}"`
            : categories.find((cat) => cat.value === category)?.label ||
              "Movies"}
        </h1>
        <div className="flex gap-4 items-center">
          <form onSubmit={handleSearchSubmit}>
            <Input
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>

          <Select disabled={!!searchQuery} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select disabled={!!searchQuery} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <></>
      ) : error ? (
        <>error</>
      ) : movies.length === 0 ? (
        <div>
          <p>No movies found matching your criteria.</p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setCategory("now_playing");
              setSortBy("popularity.desc");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <Link to={`/movies/${movie.id}`}>
                <MovieCard
                  movie={movie}
                  className="w-full hover:scale-105 hover:-translate-y-3 transition-transform duration-200"
                  onClick={() => {}}
                />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && <>Pagination not implemented</>}
        </>
      )}
    </div>
  );
};

export default MovieListPage;
