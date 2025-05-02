import { useState } from "react";
import { Link, Link as RouterLink, useNavigate } from "react-router";
import {
  Menu as MenuIcon,
  AccountCircle,
  Movie,
  Theaters,
  Home,
  Login,
  Logout,
  Person,
  AdminPanelSettings,
} from "@mui/icons-material";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NavigationBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground shadow-md">
      <h1 className="text-2xl font-bold">Project Cinema</h1>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/login" className={cn(navigationMenuTriggerStyle())}>
              Register
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              to="/register"
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-sidebar-primary text-sidebar-primary-foreground"
              )}
            >
              Register
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

export default NavigationBar;
