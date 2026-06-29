/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable successful production builds even with ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Externalize firebase-admin to prevent webpack bundling issues on Vercel
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
