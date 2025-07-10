"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  FaBars, 
  FaTimes, 
  FaTachometerAlt, 
  FaBuilding, 
  FaSeedling, 
  FaCogs, 
  FaChartBar, 
  FaBriefcase, 
  FaShoppingCart, 
  FaUsers, 
  FaBrain, 
  FaPlug, 
  FaUser, 
  FaQuestionCircle,
  FaCog
} from 'react-icons/fa';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { href: '/farms', label: 'Farm Management', icon: FaBuilding },
  { href: '/grow-management', label: 'Grow Management', icon: FaSeedling },
  { href: '/operations', label: 'Operations', icon: FaCogs },
  { href: '/devices', label: 'Device Management', icon: FaCog },
  { href: '/analytics', label: 'Analytics', icon: FaChartBar },
  { href: '/business', label: 'Business Management', icon: FaBriefcase },
  { href: '/procurement', label: 'Procurement', icon: FaShoppingCart },
  { href: '/team', label: 'Team Management', icon: FaUsers },
  { href: '/ai', label: 'AI Intelligence', icon: FaBrain },
  { href: '/integrations', label: 'Integrations', icon: FaPlug },
  { href: '/account', label: 'Account', icon: FaUser },
  { href: '/help', label: 'Help', icon: FaQuestionCircle },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <FaBars className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <FaSeedling className="text-white text-sm" />
                </div>
                <span className="font-semibold text-lg">VerticalFarm</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <FaTimes className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                VerticalFarm Management System
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Mobile-optimized bottom navigation for key actions
export function MobileBottomNav() {
  const pathname = usePathname();
  
  const quickActions = [
    { href: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { href: '/farms', label: 'Farms', icon: FaBuilding },
    { href: '/grow-management', label: 'Grow', icon: FaSeedling },
    { href: '/operations', label: 'Operations', icon: FaCogs },
    { href: '/analytics', label: 'Analytics', icon: FaChartBar },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <nav className="flex items-center justify-around py-2">
        {quickActions.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0",
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 