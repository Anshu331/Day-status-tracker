import type { NextConfig } from 'next';

const backendUrl = (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // proxy the API so the session cookie stays same-origin (no CORS needed)
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
