import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "focustrackers.my.id",
          },
        ],
        destination: "https://www.focustrackers.my.id/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
