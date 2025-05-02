import { redirect } from "react-router";
import { useAuthStore } from "../store/authStore";

export function loader() {
  const { isAuthenticated, isAdmin } = useAuthStore.getState();

  if (!isAuthenticated) {
    return redirect("/login");
  }

  if (!isAdmin) {
    return redirect("/");
  }

  return null;
}
