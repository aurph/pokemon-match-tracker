import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; never bundle it for the client/runtime.
  serverExternalPackages: ["better-sqlite3"],
  // Allow the Replit preview proxy to talk to the dev server.
  allowedDevOrigins: ["*.replit.dev", "*.repl.co", "*.replit.app", "*.picard.replit.dev"],
};

export default nextConfig;
