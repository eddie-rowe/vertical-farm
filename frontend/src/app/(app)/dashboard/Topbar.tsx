"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Topbar() {
  const { user } = useAuth();
  return (
    <header className="w-full h-16 flex items-center justify-between px-8 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Taskmaster</span>
        <nav className="hidden md:flex gap-4 ml-8">
          <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:underline">Dashboard</Link>
          <Link href="/tasks" className="text-gray-700 dark:text-gray-300 hover:underline">Tasks</Link>
          <Link href="/teams" className="text-gray-700 dark:text-gray-300 hover:underline">Teams</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </Link>
        <Link href="/account" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:underline">
          <span className="font-medium">{user?.email}</span>
          <span className="inline-block w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </span>
        </Link>
      </div>
    </header>
  );
}
