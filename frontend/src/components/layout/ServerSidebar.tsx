import { 
  FaSeedling, 
  FaChartBar, 
  FaLeaf, 
  FaQuestionCircle, 
  FaPlug, 
  FaBuilding, 
  FaDollarSign, 
  FaUsers, 
  FaBrain, 
  FaTachometerAlt, 
  FaBoxes,
  FaExclamationTriangle,
  FaCog
} from "@/lib/icons";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <FaSeedling />, variant: "primary" },
  { href: "/farms", label: "Farm Layout", icon: <FaBuilding />, variant: "growing" },
  { href: "/devices", label: "Device Configuration", icon: <FaCog />, variant: "maintenance" },
  { href: "/grow-management", label: "Grow Management", icon: <FaLeaf />, variant: "growing" },
  { href: "/operations", label: "Operations", icon: <FaTachometerAlt />, variant: "maintenance" },
  { href: "/analytics", label: "Analytics", icon: <FaChartBar />, variant: "primary" },
  { href: "/business", label: "Business Management", icon: <FaDollarSign />, variant: "primary" },
  { href: "/procurement", label: "Procurement", icon: <FaBoxes />, variant: "maintenance" },
  { href: "/team", label: "Team Management", icon: <FaUsers />, variant: "growing" },
  { href: "/ai", label: "AI Intelligence", icon: <FaBrain />, variant: "primary" },
  { href: "/integrations", label: "Integrations", icon: <FaPlug />, variant: "maintenance" },
  { href: "/alert-history", label: "Alert History", icon: <FaExclamationTriangle />, variant: "maintenance" },
  { href: "/help", label: "Help", icon: <FaQuestionCircle />, variant: "offline" },
];

interface ServerSidebarProps {
  children: React.ReactNode;
}

const ServerSidebar: React.FC<ServerSidebarProps> = ({ children }) => {
  return (
    <aside className="hidden lg:block w-64 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 shadow-lg border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
            <FaSeedling className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-farm-title text-xl font-bold text-gray-900 dark:text-gray-100">
              Farm Control
            </h2>
            <p className="text-xs text-muted-foreground">Vertical Agriculture</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {children}
        </ul>
      </nav>
    </aside>
  );
};

export default ServerSidebar; 