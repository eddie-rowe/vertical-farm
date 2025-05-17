"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  // Demo stats (replace with real data in future)
  const stats = [
    { label: "Rows", value: 2, icon: "🌱", color: "gradient-row" },
    { label: "Racks", value: 2, icon: "🗄️", color: "gradient-rack" },
    { label: "Shelves", value: 3, icon: "🪴", color: "gradient-shelf" },
    { label: "Sensors", value: 5, icon: "📡", color: "gradient-farm" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white/70 dark:bg-gray-900/80 glass border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 justify-between animate-pop">
          <div>
            <h2 className="text-lg font-bold mb-8 text-green-900 dark:text-green-100">Farm Dashboard</h2>
            <nav className="flex flex-col gap-2">
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Farm</div>
                <Link href="/dashboard/layout" className="text-green-700 dark:text-green-300 font-semibold btn-animated">Farm Layout</Link>
                <Link href="/dashboard/racks" className="text-gray-700 dark:text-gray-300 hover:underline btn-animated">Racks & Shelves</Link>
                <Link href="/dashboard/sensors" className="text-gray-700 dark:text-gray-300 hover:underline btn-animated">Sensors & Monitoring</Link>
                <Link href="/dashboard/harvest" className="text-gray-700 dark:text-gray-300 hover:underline btn-animated">Harvest Log</Link>
              </div>
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Settings</div>
                <Link href="/account" className="text-gray-700 dark:text-gray-300 hover:underline btn-animated">Account Settings</Link>
              </div>
            </nav>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 min-h-screen animate-pop">
          <h1 className="text-3xl font-bold mb-6 text-green-900 dark:text-green-100 drop-shadow-lg">Welcome, {user.email}!</h1>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className={`rounded-xl p-6 flex flex-col items-center gap-2 text-center card-shadow ${stat.color} glass animate-pop`}>
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-lg font-medium text-gray-700 dark:text-gray-200">{stat.label}</div>
              </div>
            ))}
            </div>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/dashboard/layout">
              <button className="btn-animated bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow transition-all">Configure Layout</button>
            </Link>
            <button className="btn-animated bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow transition-all">Add Row</button>
            <Link href="/dashboard/sensors">
              <button className="btn-animated bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow transition-all">View Sensors</button>
            </Link>
          </div>
          {/* Activity Feed & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="glass card-shadow p-6 rounded-lg min-h-[200px] flex flex-col animate-pop">
              <h2 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100 flex items-center gap-2">
                <span className="text-2xl">📝</span> Recent Farm Activity
              </h2>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2 flex-1 flex flex-col justify-center items-center">
                <li className="text-gray-400 italic">No recent activity. Your latest farm actions will appear here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;Rack 2 moved&quot; or &quot;Sensor alert in Row 1&quot;)</li>
              </ul>
            </section>
            <section className="glass card-shadow p-6 rounded-lg min-h-[200px] flex flex-col animate-pop">
              <h2 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100 flex items-center gap-2">
                <span className="text-2xl">🔔</span> Notifications
              </h2>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2 flex-1 flex flex-col justify-center items-center">
                <li className="text-gray-400 italic">No notifications yet. Farm alerts will show up here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;Low moisture in Row 1&quot; or &quot;Harvest ready&quot;)</li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
