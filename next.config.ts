import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: { 
    serverActions: {
      bodySizeLimit: '50mb', 
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'motion',
      'xlsx',
      'pdf-lib',
      '@radix-ui/react-dropdown-menu',
    ],
  },
  serverExternalPackages: [
    'pg',
    '@prisma/client',
    'docx',
    'mammoth',
    'nodemailer',
    'imapflow',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      {
        // Cache immutable static assets
        source: '/(images|icons|fonts|_next/static)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Force rebuild cache bust
