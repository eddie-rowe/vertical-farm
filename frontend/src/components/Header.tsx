'use client';
import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import NotificationCenter from './notifications/NotificationCenter';
import Image from 'next/image';
import { Button } from './ui/button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="w-full py-4 px-8 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/globe.svg" alt="Vertical Farm Logo Placeholder" width={32} height={32} className="h-8 w-8" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vertical Farm</h1>
      </div>
      <nav>
        <ul className="flex gap-4 items-center">
          <li><Link href="/" className={`text-gray-700 dark:text-gray-300 hover:underline focus:underline focus:outline-none transition ${pathname === '/' ? 'font-bold underline text-green-700 dark:text-green-300' : ''}`}>Home</Link></li>
          <li><Link href="/dashboard" className={`text-gray-700 dark:text-gray-300 hover:underline focus:underline focus:outline-none transition ${pathname.startsWith('/dashboard') && pathname !== '/dashboard/layout' ? 'font-bold underline text-green-700 dark:text-green-300' : ''}`}>Dashboard</Link></li>
          <li><Link href="/dashboard/layout" className={`text-gray-700 dark:text-gray-300 hover:underline focus:underline focus:outline-none transition ${pathname === '/dashboard/layout' ? 'font-bold underline text-green-700 dark:text-green-300' : ''}`}>Dashboard Layout</Link></li>
          <li><Link href="/protected" className={`text-gray-700 dark:text-gray-300 hover:underline focus:underline focus:outline-none transition ${pathname === '/protected' ? 'font-bold underline text-green-700 dark:text-green-300' : ''}`}>Protected</Link></li>
          <li><NotificationCenter /></li>
          {user && !loading ? (
            <>
              <li className="flex items-center gap-2">
                <Link href="/account" className="text-gray-700 dark:text-gray-300 text-sm hover:underline">Settings</Link>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{user.email}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2"
                >
                  Logout
                </Button>
              </li>
            </>
          ) : !loading ? (
            <li>
              <Link href="/login" className="text-primary dark:text-blue-400 hover:underline">Login</Link>
            </li>
          ) : null}
          <li>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="ml-4"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌞 Light' : '🌙 Dark'}
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
