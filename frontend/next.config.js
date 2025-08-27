/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone build for production deployments
  output: 'standalone',
  // Configure static optimization
  trailingSlash: false,
  // Asset optimization
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig