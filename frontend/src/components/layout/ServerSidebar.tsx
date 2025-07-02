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
  FaBoxes 
} from "@/lib/icons";

export const navItems = [
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

interface ServerSidebarProps {
  children: React.ReactNode;
}

const ServerSidebar: React.FC<ServerSidebarProps> = ({ children }) => {
  return (
    <aside className="hidden lg:block w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Navigation</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 px-4">
          {children}
        </ul>
      </nav>
    </aside>
  );
};

export default ServerSidebar; 