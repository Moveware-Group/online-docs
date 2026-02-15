/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Moveware App",
  },
  // Image configuration for remote patterns
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
