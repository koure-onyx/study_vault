// apps/admin/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@studyvault/db', '@studyvault/lib'],
  serverExternalPackages: ['mongoose'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
