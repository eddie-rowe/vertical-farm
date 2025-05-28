import React from 'react';
import Header from '../../components/Header'; // Adjusted path
import Sidebar from '../../components/Sidebar'; // Adjusted path
// import { AuthProvider } from '../../context/AuthContext'; // Removed - now in root layout
import { ThemeProvider } from '../../context/ThemeContext';
import ProtectedPageWrapper from "../../components/auth/ProtectedPageWrapper";

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
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedPageWrapper>
    </ThemeProvider>
  );
} 