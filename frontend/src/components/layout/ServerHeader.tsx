import Image from 'next/image';

interface ServerHeaderProps {
  children?: React.ReactNode;
}

const ServerHeader: React.FC<ServerHeaderProps> = ({ children }) => {
  return (
    <header className="w-full py-4 px-8 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      {/* Brand Section - Server Rendered */}
      <div className="flex items-center gap-3">
        <Image src="/globe.svg" alt="Vertical Farm Logo" width={32} height={32} className="h-8 w-8" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vertical Farm</h1>
      </div>
      
      {/* Client Actions Section */}
      {children}
    </header>
  );
};

export default ServerHeader; 