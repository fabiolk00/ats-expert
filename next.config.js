/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  async redirects() {
    return []
  },
}

module.exports = nextConfig
