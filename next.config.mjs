const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Required for deployment, but breaks camera on HTTP
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
