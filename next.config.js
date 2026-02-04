/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Moveware App',
  },
  // Image domains for Next.js Image component if needed
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
