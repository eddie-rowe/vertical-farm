'use client';
import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './notifications/NotificationCenter';
import Image from 'next/image';
import { Button } from './ui/button';
import { ChevronDown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="w-full py-4 px-8 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      {/* Brand Section */}
      <div className="flex items-center gap-3">
        <Image src="/globe.svg" alt="Vertical Farm Logo" width={32} height={32} className="h-8 w-8" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vertical Farm</h1>
      </div>
      
      {/* User Actions Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <NotificationCenter />
        
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌞' : '🌙'}
        </Button>

        {/* User Menu */}
        {user && !loading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
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
    </header>
  );
};

export default Header;
