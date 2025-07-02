import ServerSidebar from './ServerSidebar';
import ClientSidebarNavigation from './ClientSidebarNavigation';

const Sidebar = () => {
  return (
    <ServerSidebar>
      <ClientSidebarNavigation />
    </ServerSidebar>
  );
};

export default Sidebar;
