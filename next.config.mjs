/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable successful production builds even with ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
