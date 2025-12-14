/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Stub out Node.js modules for client-side
      fs: { browser: './src/lib/empty-module.js' },
      path: { browser: './src/lib/empty-module.js' },
      os: { browser: './src/lib/empty-module.js' },
      crypto: { browser: './src/lib/empty-module.js' },
      stream: { browser: './src/lib/empty-module.js' },
      http: { browser: './src/lib/empty-module.js' },
      https: { browser: './src/lib/empty-module.js' },
      zlib: { browser: './src/lib/empty-module.js' },
      net: { browser: './src/lib/empty-module.js' },
      tls: { browser: './src/lib/empty-module.js' },
    },
  },
};

export default nextConfig;
