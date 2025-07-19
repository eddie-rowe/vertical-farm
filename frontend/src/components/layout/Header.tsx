import ServerHeader from "./ServerHeader";
import ClientHeaderActions from "./ClientHeaderActions";

const Header: React.FC = () => {
  return (
    <ServerHeader>
      <ClientHeaderActions />
    </ServerHeader>
  );
};

export default Header;
