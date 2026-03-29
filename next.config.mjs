const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Required for deployment, but breaks camera on HTTP
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
