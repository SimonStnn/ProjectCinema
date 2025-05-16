import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Theaters } from "@mui/icons-material";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NavigationBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-sky-800 text-white shadow-md select-none">
      <Link to="/" className="flex items-center space-x-2">
        <Theaters className="h-full size-3 text-primary" />
        <h1 className="flex flex-col font-mono">
          <span className="pl-0.5 text-sm opacity-80 leading-none">
            Project
          </span>
          <span className="text-2xl font-bold leading-none uppercase tracking-widest">
            Cinema
          </span>
        </h1>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link
              to="/movies"
              className={cn(
                navigationMenuTriggerStyle(),
                buttonVariants({
                  variant: "ghost",
                }),
                "bg-sky-800 text-white hover:bg-sky-700 hover:text-white"
              )}
            >
              Movies
            </Link>
          </NavigationMenuItem>
          {!isAuthenticated && (
            <>
              <NavigationMenuItem>
                <Link
                  to="/login"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    buttonVariants({
                      variant: "ghost",
                    }),
                    "bg-sky-800 text-white hover:bg-sky-700 hover:text-white"
                  )}
                >
                  Login
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  to="/register"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    buttonVariants({
                      variant: "default",
                    }),
                    "hover:text-sidebar"
                  )}
                >
                  Register
                </Link>
              </NavigationMenuItem>
            </>
          )}
          {isAuthenticated && isAdmin && (
            <NavigationMenuItem>
              <Link
                to="/admin/dashboard"
                className={cn(
                  navigationMenuTriggerStyle(),
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
                )}
              >
                Manager Dashboard
              </Link>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
        {isAuthenticated && (
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger className="ml-4">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/tickets")}>
                My Tickets
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                  Manager Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </NavigationMenu>
    </header>
  );
};

export default NavigationBar;
