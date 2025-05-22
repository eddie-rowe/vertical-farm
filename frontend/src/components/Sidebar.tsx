"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaSeedling, FaChartBar, FaTable, FaBell, FaCog, FaQuestionCircle, FaThList } from "react-icons/fa";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <FaSeedling /> },
  { href: "/dashboard/farms", label: "Farms", icon: <FaThList /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <FaChartBar /> },
  { href: "/dashboard/data", label: "Data Table", icon: <FaTable /> },
  { href: "/dashboard/notifications", label: "Notifications", icon: <FaBell /> },
  { href: "/settings", label: "Settings", icon: <FaCog /> },
  { href: "/help", label: "Help", icon: <FaQuestionCircle /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white/70 dark:bg-gray-900/80 glass border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 justify-between animate-pop min-h-screen">
      <div>
        <h2 className="text-2xl font-extrabold mb-8 text-green-900 dark:text-green-100 tracking-tight drop-shadow-lg">Vertical Farm</h2>
        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all text-lg ${
                  isActive
                    ? "bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 font-bold shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
