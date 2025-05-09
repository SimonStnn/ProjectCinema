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
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <footer className="flex justify-center items-center p-4 bg-sky-800 text-sidebar">
      &copy; {new Date().getFullYear()} Project Cinema. All rights reserved.
    </footer>
  );
};

export default Footer;
