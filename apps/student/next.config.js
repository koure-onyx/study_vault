// apps/student/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  transpilePackages: ['@studyvault/db', '@studyvault/lib'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    dangerouslyAllowSVG: true,
  },
  serverExternalPackages: ['mongoose'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
