/** @type {import('next').NextConfig} */
const nextConfig = {
  serverComponentsExternalPackages: ["better-sqlite3"],
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/demo",
        destination: "/demo.html",
      },
    ];
  },
};

export default nextConfig;
