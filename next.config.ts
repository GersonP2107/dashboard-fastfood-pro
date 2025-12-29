import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2nagnwby8accc.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "khvoqyqpsjbjwqaqfnub.supabase.co", // Assuming this is your Supabase ref
      },
    ],
  },
};

export default nextConfig;
