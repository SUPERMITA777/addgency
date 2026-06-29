/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable successful production builds even with ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Externalize firebase-admin and its sub-dependencies to prevent webpack bundling issues on Vercel
    serverComponentsExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  },
};

export default nextConfig;
