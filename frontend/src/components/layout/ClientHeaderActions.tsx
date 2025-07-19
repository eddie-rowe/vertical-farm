"use client";

import Link from "next/link";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import NotificationCenter from "../shared/system/notifications/NotificationCenter";
import { MobileNavigation } from "./MobileNavigation";
import { Button } from "../ui/button";
import { ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

const ClientHeaderActions: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Mobile Navigation - Only shows on mobile/tablet */}
      <MobileNavigation />

      {/* Notifications */}
      <NotificationCenter />

      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌞" : "🌙"}
      </Button>

      {/* User Menu */}
      {user && !loading ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{user.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/account">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : !loading ? (
        <Button asChild variant="default" size="sm">
          <Link href="/login">Login</Link>
        </Button>
      ) : null}
    </div>
  );
};

export default ClientHeaderActions;
