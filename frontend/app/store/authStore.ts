import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

// Import environment variables explicitly
const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
            email,
            password,
          });

          const { access_token } = response.data;
          const decoded = jwtDecode<JwtPayload>(access_token);

          const user: User = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
            role: decoded.role,
          };

          // Set auth header for future requests
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${access_token}`;

          set({
            isAuthenticated: true,
            isAdmin: user.role === "admin",
            user,
            token: access_token,
            loading: false,
          });
        } catch (error) {
          let errorMessage = "Login failed. Please check your credentials.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.detail || errorMessage;
          }

          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const response = await axios.post(`${API_URL}/api/v1/auth/register`, {
            name,
            email,
            password,
          });

          const { access_token } = response.data;
          const decoded = jwtDecode<JwtPayload>(access_token);

          const user: User = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
            role: decoded.role,
          };

          // Set auth header for future requests
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${access_token}`;

          set({
            isAuthenticated: true,
            isAdmin: user.role === "admin",
            user,
            token: access_token,
            loading: false,
          });
        } catch (error) {
          let errorMessage = "Registration failed. Please try again.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.detail || errorMessage;
          }

          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // Remove auth header
        delete axios.defaults.headers.common["Authorization"];

        set({
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          token: null,
        });
      },

      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          return false;
        }

        try {
          // Check if token is expired
          const decoded = jwtDecode<JwtPayload>(token);
          const currentTime = Math.floor(Date.now() / 1000);

          if (decoded.exp < currentTime) {
            get().logout();
            return false;
          }

          // Set auth header for future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Verify token with backend
          await axios.get(`${API_URL}/api/v1/auth/me`);

          const user: User = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
            role: decoded.role,
          };

          set({
            isAuthenticated: true,
            isAdmin: user.role === "admin",
            user,
          });

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);
