import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server external packages for Node.js compatibility
  serverExternalPackages: ['pdf-parse'],
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // Image optimization
  images: {
    domains: [],
    unoptimized: true
  }
};

export default nextConfig;
