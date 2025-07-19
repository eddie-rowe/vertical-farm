import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Header from "../components/Header"; // Removed
// import Sidebar from "../components/Sidebar"; // Removed
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext"; // Re-added for global access
import { RealtimeProvider } from "../contexts/RealtimeContext";
import DatadogInit from "./datadog-init";
import { Toaster } from "react-hot-toast";
import InstallPrompt from "../components/InstallPrompt";
import PWAStatus from "../components/PWAStatus";
import NotificationManager from "../components/NotificationManager";

// Optimized font loading with preload and display swap
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});

// Comprehensive metadata for SEO and social sharing
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://vertical-farm.goodgoodgreens.org"
      : "http://localhost:3000",
  ),
  title: {
    default: "Vertical Farm Management System",
    template: "%s | Vertical Farm",
  },
  description:
    "Advanced control, monitoring, and management system for your vertical farming operations. Optimize growth conditions, track plant health, and maximize yields.",
  keywords: [
    "vertical farming",
    "agriculture",
    "hydroponics",
    "IoT",
    "smart farming",
    "crop management",
  ],
  authors: [{ name: "Good Good Greens" }],
  creator: "Good Good Greens",
  publisher: "Good Good Greens",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vertical-farm.goodgoodgreens.org",
    siteName: "Vertical Farm Management System",
    title: "Vertical Farm Management System",
    description:
      "Advanced control, monitoring, and management system for your vertical farming operations.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vertical Farm Management System",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Vertical Farm Management System",
    description:
      "Advanced control, monitoring, and management system for your vertical farming operations.",
    creator: "@goodgoodgreens",
    images: ["/images/twitter-image.png"],
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons and manifest
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#059669" },
    ],
  },

  manifest: "/manifest.json",

  // Additional meta tags
  category: "agriculture",
  classification: "business",

  // Verification
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

// Viewport configuration for responsive design
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//api.goodgoodgreens.org" />

        {/* Preconnect for critical resources */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Additional meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Vertical Farm Management System",
              description:
                "Advanced control, monitoring, and management system for vertical farming operations",
              url: "https://vertical-farm.goodgoodgreens.org",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              author: {
                "@type": "Organization",
                name: "Good Good Greens",
              },
            }),
          }}
        />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('[SW] Registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DatadogInit />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
            success: {
              iconTheme: {
                primary: "var(--primary)",
                secondary: "var(--primary-foreground)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--destructive)",
                secondary: "var(--destructive-foreground)",
              },
            },
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <RealtimeProvider>
              {children}
              <InstallPrompt />
              <PWAStatus />
              <NotificationManager />
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
