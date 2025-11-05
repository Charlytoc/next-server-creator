import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        stream: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        crypto: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
};

export default withWorkflow(nextConfig);
