'use client';
import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();

  return (
    <header className="w-full py-4 px-8 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Taskmaster Sandbox</h1>
      <nav>
        <ul className="flex gap-4 items-center">
          <li><Link href="/" className="text-gray-700 dark:text-gray-300 hover:underline">Home</Link></li>
          <li><Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:underline">Dashboard</Link></li>
          <li><Link href="/dashboard/layout" className="text-gray-700 dark:text-gray-300 hover:underline">Dashboard Layout</Link></li>
          <li><Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:underline">Profile</Link></li>
          <li><Link href="/protected" className="text-gray-700 dark:text-gray-300 hover:underline">Protected</Link></li>
          <li><Link href="/account" className="text-gray-700 dark:text-gray-300 hover:underline">Account</Link></li>
          <li><Link href="/auth" className="text-gray-700 dark:text-gray-300 hover:underline">Auth</Link></li>
          <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:underline">About</a></li>
          {user && !loading ? (
            <>
              <li className="flex items-center gap-2">
                <a href="/account" className="text-gray-700 dark:text-gray-300 text-sm hover:underline">Settings</a>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{user.email}</span>
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  className="ml-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition text-sm"
                >
                  Logout
                </button>
              </li>
            </>
          ) : !loading ? (
            <li>
              <a href="/auth" className="text-primary dark:text-blue-400 hover:underline">Login</a>
            </li>
          ) : null}
          <li>
            <button
              onClick={toggleTheme}
              className="ml-4 px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌞 Light' : '🌙 Dark'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header; 