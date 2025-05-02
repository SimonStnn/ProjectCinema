import { redirect } from "react-router";
import { useAuthStore } from "../store/authStore";

export function loader() {
  const { isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated) {
    return redirect("/login");
  }

  return null;
}
