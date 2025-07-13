import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Output optimization
  output: 'standalone',
  
  // Experimental optimizations
  experimental: {
    webpackBuildWorker: true,
    // Optimize server components
    serverComponentsHmrCache: true,
  },
  
  // Image optimization for farm photos/diagrams
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true, // For farm layout diagrams
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression
  compress: true,
  
  // Power-up for production builds
  poweredByHeader: false,
  
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache optimization for static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Performance optimizations
    if (!dev) {
      // Bundle splitting optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Separate vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate UI components for farm-specific features
            farmComponents: {
              test: /[\\/]src[\\/]components[\\/](features|ui)[\\/]/,
              name: 'farm-components',
              chunks: 'all',
              priority: 20,
            },
            // Separate service layer
            services: {
              test: /[\\/]src[\\/]services[\\/]/,
              name: 'services',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };

      // Tree shaking improvements
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Client-side optimizations
    if (!isServer) {
      // Reduce bundle size by excluding server-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Development optimizations
    if (dev) {
      // Faster builds in development
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }

    return config;
  }
};

export default nextConfig;
