import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // reactStrictMode is intentionally disabled: React Strict Mode's double-invoke
  // of effects in development would mask the race-condition bug in the example
  // form. Candidates may enable it for their own code.
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
};

export default nextConfig;
