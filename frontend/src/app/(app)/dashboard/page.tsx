"use client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  // Demo stats (replace with real data in future)
  const stats = [
    { label: "Rows", value: 2, icon: "🌱", color: "gradient-row" },
    { label: "Racks", value: 2, icon: "🗄️", color: "gradient-rack" },
    { label: "Shelves", value: 3, icon: "🪴", color: "gradient-shelf" },
    { label: "Sensors", value: 5, icon: "📡", color: "gradient-farm" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 min-h-screen animate-pop" aria-label="Dashboard main content">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">Welcome, {user.email}!</h1>
        {/* Stats Cards */}
        <section aria-label="Farm stats">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <Card key={stat.label} className={`text-center card-shadow animate-pop ${stat.color}`}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-4xl mb-2">{stat.icon}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
        {/* Activity Feed & Notifications */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Activity and notifications">
          <Card className="animate-pop">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-green-900 dark:text-green-100">
                <span className="text-2xl">📝</span> Recent Farm Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center">
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                <li className="text-gray-400 italic">No recent activity. Your latest farm actions will appear here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;Rack 2 moved&quot; or &quot;Sensor alert in Row 1&quot;)</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="animate-pop">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-green-900 dark:text-green-100">
                <span className="text-2xl">🔔</span> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center">
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                <li className="text-gray-400 italic">No notifications yet. Farm alerts will show up here.</li>
                <li className="text-gray-400 italic">(e.g., &quot;Low moisture in Row 1&quot; or &quot;Harvest ready&quot;)</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
