/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Enable standalone build for production deployments
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Configure static optimization
  trailingSlash: false,
  // Asset optimization
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig