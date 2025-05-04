import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/movies", "routes/movies.tsx"),
  route("/movies/:movie_id", "routes/movieDetails.tsx"),
  route("/login", "routes/login.tsx"),
  route("/register", "routes/register.tsx"),
] satisfies RouteConfig;
