import type { NextConfig } from "next";
import { env } from "./src/lib/env";

void env;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
