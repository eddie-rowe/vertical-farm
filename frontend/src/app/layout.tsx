import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Header from "../components/Header"; // Removed
// import Sidebar from "../components/Sidebar"; // Removed
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext"; // Re-added for global access
import DatadogInit from "./datadog-init";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vertical Farm",
  description: "Control, monitor, and manage your vertical farm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DatadogInit />
        <Toaster position="top-right" />
        <ThemeProvider>
          <AuthProvider>
            {/* AuthProvider is now in AppLayout */}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
