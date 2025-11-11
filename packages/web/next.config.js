/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pottery/core'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
