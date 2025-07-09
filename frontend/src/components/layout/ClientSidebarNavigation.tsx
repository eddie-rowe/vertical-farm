'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from './ServerSidebar';

type NavVariant = "primary" | "maintenance" | "offline" | "growing" | "default";

const ClientSidebarNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const variant = isActive ? (item.variant as NavVariant) : "ghost";
        
        return (
          <li key={item.href}>
            <Button
              asChild
              variant={variant}
              size="lg"
              animation={isActive ? "float" : "none"}
              className={`w-full justify-start gap-4 h-auto px-5 py-4 ${
                isActive
                  ? "shadow-md text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Link href={item.href} className="flex items-center gap-4 w-full">
                <span className={`text-xl ${
                  isActive 
                    ? "text-white" 
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                }`}>
                  {item.icon}
                </span>
                <span className="font-semibold text-base text-control-label">{item.label}</span>
              </Link>
            </Button>
          </li>
        );
      })}
    </>
  );
};

export default ClientSidebarNavigation; 