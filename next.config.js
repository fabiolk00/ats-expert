/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  async redirects() {
    return [
      { source: '/login', destination: '/entrar', permanent: true },
      { source: '/signup', destination: '/criar-conta', permanent: true },
      { source: '/pricing', destination: '/precos', permanent: true },
      { source: '/what-is-ats', destination: '/o-que-e-ats', permanent: true },
      { source: '/privacy', destination: '/privacidade', permanent: true },
      { source: '/terms', destination: '/termos', permanent: true },
      { source: '/checkout', destination: '/finalizar-compra', permanent: true },
    ]
  },
}

module.exports = nextConfig
