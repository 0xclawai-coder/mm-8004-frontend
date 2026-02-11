import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "pino-pretty": "",
      encoding: "",
      "@react-native-async-storage/async-storage": "",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "pino-pretty": false,
        encoding: false,
      };
    }
    if (isServer) {
      config.externals.push("@react-native-async-storage/async-storage");
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: "/agents",
        destination: "/explore/agents",
        permanent: true,
      },
      {
        source: "/agents/:agentId",
        destination: "/explore/agents/:agentId",
        permanent: true,
      },
      {
        source: "/leaderboard",
        destination: "/analytics/leaderboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
