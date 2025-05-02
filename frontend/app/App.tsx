import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import NavigationBar from "./components/layout/NavigationBar";
import Footer from "./components/layout/Footer";
import { useAuthStore } from "./store/authStore";
import { initializeMqttClient } from "./services/mqttService";
import { useRoutes } from "react-router";
import routes from "./routes";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1d3557",
    },
    secondary: {
      main: "#e63946",
    },
    background: {
      default: "#f1faee",
      paper: "#ffffff",
    },
    text: {
      primary: "#293241",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via token in localStorage
    const initialize = async () => {
      await checkAuth();
      initializeMqttClient();
      setIsLoading(false);
    };

    initialize();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      {/* <CssBaseline /> */}
      <NavigationBar />
      <Outlet />
      <Footer />
    </ThemeProvider>
  );
}

export default App;
