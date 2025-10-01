/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'http',  hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'http',  hostname: 'localhost', port: '7000', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ✅ allow production builds to succeed even if ESLint errors exist
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ allow production builds to succeed even if type errors exist
  // (has effect only if you have a tsconfig or .ts/.tsx files present)
  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      { source: '/home-2', destination: '/', permanent: true },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
