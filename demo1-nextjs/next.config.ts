import type { NextConfig } from 'next'

// Defaults are fine: route handlers run on every request and nothing is cached,
// which is what an app backed by an in-memory database needs.
const nextConfig: NextConfig = {}

export default nextConfig
