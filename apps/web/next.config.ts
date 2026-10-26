import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@focus/types", "@focus/utils", "@focus/ui"],
};

export default nextConfig;
