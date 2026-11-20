/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const assetBaseUrl =
  process.env.R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  process.env.ASSET_PUBLIC_BASE_URL ||
  '';
let assetHostname = '';
try {
  if (assetBaseUrl) assetHostname = new URL(assetBaseUrl).hostname;
} catch (e) {}

const customRemotePatterns = [
  { protocol: 'https', hostname: '*.supabase.co' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: '*.unsplash.com' },
  { protocol: 'https', hostname: 'flagcdn.com' },
  { protocol: 'https', hostname: '*.googleusercontent.com' },
  { protocol: 'https', hostname: '*.gravatar.com' },
  { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
  { protocol: 'https', hostname: '*.r2.dev' },
  { protocol: 'https', hostname: 'thenexttrade.app' },
  { protocol: 'https', hostname: '*.thenexttrade.app' },
];

if (assetHostname) {
  customRemotePatterns.push({ protocol: 'https', hostname: assetHostname });
}

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['nodemailer'],
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.14', '127.0.0.1'],
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'lodash',
      'react-icons',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@tiptap/react',
      '@tiptap/starter-kit'
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Exclude large static assets and media from serverless function bundles (Vercel 250MB limit)
  outputFileTracingExcludes: {
    '*': [
      './public/**',
      './content/**',
      './docs/**',
      './scripts/**',
      './node_modules/@swc/core-win32-x64-msvc/**',
      './node_modules/@swc/core-linux-x64-gnu/**',
      './node_modules/@esbuild/**',
      './node_modules/terser/**',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: customRemotePatterns,
  },
  async headers() {
    // In dev mode: send HSTS max-age=0 to clear any cached HSTS from browser
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=0'
            }
          ]
        }
      ];
    }
    const isHttpsApp = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: isHttpsApp
              ? 'max-age=63072000; includeSubDomains; preload'
              : 'max-age=0'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },

      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400'
          }
        ]
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400'
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/tools/risk-calculator',
        destination: '/tools/position-size-calculator',
        permanent: true,
      },
      {
        source: '/admin/ea/:path*',
        destination: '/admin/trading-systems/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig);
