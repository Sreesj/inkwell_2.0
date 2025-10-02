import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    // Force Turbopack to treat this project as the root (fix multi-lockfile warning)
    root: path.resolve(__dirname),
    // Provide aliases for CJS deps under Turbopack as well
    resolveAlias: {
      'safe-buffer': require.resolve('./src/polyfills/safe-buffer.js')
    }
  },
  webpack: (config) => {
    // Ensure node-fetch is resolvable for gaxios/google-auth-library when bundled by Next
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'safe-buffer': require.resolve('./src/polyfills/safe-buffer.js')
    }
    // Inject polyfill entry for server runtime
    config.entry = async () => {
      const entries = await (typeof config.entry === 'function' ? config.entry() : config.entry)
      if (entries['main-app'] && !entries['main-app'].includes('./src/polyfills/node-fetch.ts')) {
        entries['main-app'].unshift('./src/polyfills/node-fetch.ts')
      }
      return entries
    }
    return config
  }
}

export default nextConfig
