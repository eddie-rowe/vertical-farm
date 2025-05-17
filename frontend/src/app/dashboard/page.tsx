"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Topbar from "./Topbar";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 justify-between">
          <div>
            <h2 className="text-lg font-bold mb-8 text-gray-900 dark:text-gray-100">Dashboard</h2>
            <nav className="flex flex-col gap-2">
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Main</div>
                <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 font-semibold">Overview</Link>
              </div>
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Work</div>
                <Link href="/dashboard/tasks" className="text-gray-700 dark:text-gray-300 hover:underline">Tasks</Link>
                <Link href="/dashboard/projects" className="text-gray-700 dark:text-gray-300 hover:underline">Projects</Link>
                <Link href="/dashboard/teams" className="text-gray-700 dark:text-gray-300 hover:underline">Teams</Link>
              </div>
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Other</div>
                <Link href="/dashboard/notifications" className="text-gray-700 dark:text-gray-300 hover:underline">Notifications</Link>
              </div>
            </nav>
          </div>
          <div>
            <Link href="/account" className="text-gray-700 dark:text-gray-300 hover:underline text-sm block mt-8">Account Settings</Link>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8 bg-white dark:bg-gray-950">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Welcome, {user.email}!</h1>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow flex items-center gap-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <div>
                <div className="text-3xl font-bold">0</div>
                <div>Tasks</div>
              </div>
            </div>
            <div className="p-6 rounded-lg bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 shadow flex items-center gap-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21h13a2 2 0 0 0 2-2v-1a7 7 0 0 0-14 0v1a2 2 0 0 0 2 2z"/></svg>
              <div>
                <div className="text-3xl font-bold">0</div>
                <div>Teams</div>
              </div>
            </div>
            <div className="p-6 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 shadow flex items-center gap-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <div>
                <div className="text-3xl font-bold">0</div>
                <div>Agents</div>
              </div>
            </div>
          </div>
          {/* Activity Feed & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow min-h-[200px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Recent Activity
              </h2>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2 flex-1 flex flex-col justify-center items-center">
                <li className="text-gray-400 italic">No recent activity. Your latest actions will appear here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;You completed Task #123&quot; or &quot;Team Alpha was created&quot;)</li>
              </ul>
            </section>
            <section className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow min-h-[200px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                Notifications
              </h2>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2 flex-1 flex flex-col justify-center items-center">
                <li className="text-gray-400 italic">No notifications yet. System and team alerts will show up here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;You were assigned to Task #456&quot; or &quot;System update available&quot;)</li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
