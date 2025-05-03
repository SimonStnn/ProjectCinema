import { useState, useEffect } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Link as RouterLink,
  useLocation,
} from "react-router";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Movie as MovieIcon,
  TheaterComedy as TheaterIcon,
  Event as EventIcon,
  Group as UsersIcon,
  ConfirmationNumber as BookingIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";
import AdminMovieList from "../components/admin/AdminMovieList";
import CinemaSettings from "../components/admin/AdminCinemaList";
import AdminShowingList from "../components/admin/AdminShowingList";
import AdminUserList from "../components/admin/AdminUserList";
import AdminBookingList from "../components/admin/AdminBookingList";
import AdminDashboardHome from "../components/admin/AdminDashboardHome";
import AdminSettings from "../components/admin/AdminSettings";

const drawerWidth = 240;

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, _] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    setLoading(false);
  }, [user, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === `/admin${path}`;
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "" },
    { text: "Movies", icon: <MovieIcon />, path: "/movies" },
    { text: "Rooms", icon: <TheaterIcon />, path: "/cinema" },
    { text: "Showings", icon: <EventIcon />, path: "/showings" },
    { text: "Users", icon: <UsersIcon />, path: "/users" },
    { text: "Bookings", icon: <BookingIcon />, path: "/bookings" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Cinema Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={`/admin${item.path}`}
            selected={isActive(item.path)}
            onClick={() => setMobileOpen(false)}
            sx={{
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": {
                  color: "primary.contrastText",
                },
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive(item.path) ? "primary.contrastText" : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Cinema Administration
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="admin sections"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Paper sx={{ p: 2, minHeight: "80vh" }}>
          <Routes>
            <Route path="" element={<AdminDashboardHome />} />
            <Route path="/movies" element={<AdminMovieList />} />
            <Route path="/cinema" element={<CinemaSettings />} />
            <Route path="/showings" element={<AdminShowingList />} />
            <Route path="/users" element={<AdminUserList />} />
            <Route path="/bookings" element={<AdminBookingList />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
