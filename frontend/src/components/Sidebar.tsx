"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaSeedling, FaChartBar, FaLeaf, FaCog, FaQuestionCircle, FaPlug, FaBuilding, FaDollarSign, FaUsers, FaBrain, FaTachometerAlt, FaBoxes } from "react-icons/fa";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <FaSeedling /> },
  { href: "/farms", label: "Farm Management", icon: <FaBuilding /> },
  { href: "/grow-management", label: "Grow Management", icon: <FaLeaf /> },
  { href: "/operations", label: "Operations", icon: <FaTachometerAlt /> },
  { href: "/analytics", label: "Analytics", icon: <FaChartBar /> },
  { href: "/business", label: "Business Management", icon: <FaDollarSign /> },
  { href: "/procurement", label: "Procurement", icon: <FaBoxes /> },
  { href: "/team", label: "Team Management", icon: <FaUsers /> },
  { href: "/ai", label: "AI Intelligence", icon: <FaBrain /> },
  { href: "/integrations", label: "Integrations", icon: <FaPlug /> },
  { href: "/help", label: "Help", icon: <FaQuestionCircle /> },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Navigation</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 shadow-sm border border-green-200 dark:border-green-700"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <span className={`text-lg ${isActive ? "text-green-600 dark:text-green-400" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
