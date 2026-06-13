import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dashscope-result-*.oss-*.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "dashscope-*.oss-accelerate.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "*.oss-*.aliyuncs.com",
      },
    ],
  },
  allowedDevOrigins: ['192.168.64.13', 'localhost', '127.0.0.1', '0.0.0.0'],
};

export default nextConfig;
