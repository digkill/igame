import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Включаем standalone режим для Docker
};

export default nextConfig;
