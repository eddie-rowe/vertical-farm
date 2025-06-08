import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance Optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'framer-motion'],
    // PPR disabled for testing compatibility
    // ppr: true, // Partial Prerendering - requires canary Next.js for Jest
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {},

  // Bundle Optimization
  webpack: (config, { dev, isServer }) => {
    // Enable tree shaking for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }

    // Optimize chunk splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Image Optimization
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security Headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            [
              "connect-src 'self'",
              // Always include localhost for development - Docker builds may not have NODE_ENV set correctly
              "http://localhost:8000",
              "ws://localhost:8000", 
              "https://api.goodgoodgreens.org",
              "wss://api.goodgoodgreens.org",
              "https://vertical-farm.goodgoodgreens.org",
              "https://*.supabase.co",
              "https://browser-intake-us5-datadoghq.com"
            ].join(' '),
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
          ].join('; ')
        },
      ],
    },
  ],

  // Caching Strategy
  generateBuildId: async () => {
    // Use git commit hash or timestamp for cache busting
    return `build-${Date.now()}`;
  },

  // Compiler Options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Output - removed standalone for standard deployment
  // output: 'standalone', // Commented out - causes issues with "next start"

  // Redirects and Rewrites
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
  ],

  // TypeScript Configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint Configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment Variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Enable React Strict Mode
  reactStrictMode: true,

  // Power by Next.js header
  poweredByHeader: false,

  // Trailing slash handling
  trailingSlash: false,
};

export default nextConfig;
