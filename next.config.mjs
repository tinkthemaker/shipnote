/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module; keep it external to the bundler.
  serverComponentsExternalPackages: ["better-sqlite3"],

  // Standalone output for the Docker image (slice 8).
  output: "standalone",
};

export default nextConfig;
