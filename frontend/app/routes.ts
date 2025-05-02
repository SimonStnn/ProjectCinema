import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/HomePage.tsx"),
  route("/movies", "pages/MovieListPage.tsx"),
  route("/movies/:id", "pages/MovieDetailPage.tsx"),
  route("/booking/:movieId/:showingId", "pages/BookingPage.tsx"),
  route("/checkout", "pages/CheckoutPage.tsx"),
  route("/login", "pages/LoginPage.tsx"),
  route("/register", "pages/RegisterPage.tsx"),
  route("/profile", "pages/ProfilePage.tsx"),
  route("/admin/*", "pages/AdminDashboardPage.tsx"),
  route("*", "pages/NotFoundPage.tsx"),
] satisfies RouteConfig;
