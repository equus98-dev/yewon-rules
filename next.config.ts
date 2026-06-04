import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack uses default edge settings.
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
