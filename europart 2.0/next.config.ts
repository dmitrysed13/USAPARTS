import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/prodazha-avtozapchastey",
        destination: "/kupit-zapchasti",
        permanent: true,
      },
      {
        source: "/kupit-bu-zapchasti",
        destination: "/bu-zapchasti",
        permanent: true,
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
