'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from './ServerSidebar';

const ClientSidebarNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
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
    </>
  );
};

export default ClientSidebarNavigation; 