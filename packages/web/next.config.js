/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pottery/core'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // Ignore Node.js modules when bundling client code
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent importing storage/validation modules in client
        '@pottery/core/storage': false,
        '@pottery/core/validation': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
