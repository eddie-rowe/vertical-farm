import React from 'react';
import { Header, Sidebar } from '../../components/layout';
import { MobileBottomNav } from '../../components/layout/MobileNavigation';
// import { AuthProvider } from '../../context/AuthContext'; // Removed - now in root layout
import { ThemeProvider } from '../../context/ThemeContext';
import ProtectedPageWrapper from "../../components/pages/auth/ProtectedPageWrapper";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <ProtectedPageWrapper>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 pb-20 lg:pb-4">
              {children}
            </main>
          </div>
        </div>
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </ProtectedPageWrapper>
    </ThemeProvider>
  );
} 