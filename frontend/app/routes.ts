import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/movies", "routes/movies/index.tsx"),
  route("/movieDetails/:id", "routes/movieDetails/[id].tsx"),
  route("/reserve/:id", "routes/reserve/[id].tsx"),
  route("/login", "routes/login.tsx"),
  route("/register", "routes/register.tsx"),
  route("/profile", "routes/profile/index.tsx"),
  route("/profile/tickets", "routes/profile/tickets.tsx"),
  route("/admin/dashboard", "routes/admin/dashboard.tsx"),
  route("/admin/screenings/add", "routes/admin/screenings/add.tsx"),
  route("/admin/screenings/edit/:id", "routes/admin/screenings/edit/[id].tsx"),
] satisfies RouteConfig;
