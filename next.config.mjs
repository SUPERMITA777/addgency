/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling firebase-admin and its problematic
      // sub-dependencies (jwks-rsa → jose ESM-only). Instead, they will
      // be resolved at runtime from node_modules via Node's native require.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/auth',
        'firebase-admin/firestore',
        'firebase-admin/storage',
        'jwks-rsa',
        'jose',
      ];
    }
    return config;
  },
};

export default nextConfig;
