import ClientHeaderActions from "./ClientHeaderActions";
import ServerHeader from "./ServerHeader";

const Header: React.FC = () => {
  return (
    <ServerHeader>
      <ClientHeaderActions />
    </ServerHeader>
  );
};

export default Header;
