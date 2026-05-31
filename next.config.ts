import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serverExternalPackages: ["pg", "@prisma/adapter-pg"], 삭제 - Cloudflare에서 require() 에러 방지용 번들링
};

export default nextConfig;
