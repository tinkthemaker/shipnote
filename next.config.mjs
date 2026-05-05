/** @type {import('next').NextConfig} */
const nextConfig = {
  serverComponentsExternalPackages: ["better-sqlite3"],
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/demo",
        destination: "/demo.html",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
