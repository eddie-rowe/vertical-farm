import ClientSidebarNavigation from "./ClientSidebarNavigation";
import ServerSidebar from "./ServerSidebar";

const Sidebar = () => {
  return (
    <ServerSidebar>
      <ClientSidebarNavigation />
    </ServerSidebar>
  );
};

export default Sidebar;
