/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const assetBaseUrl = process.env.ASSET_PUBLIC_BASE_URL || '';
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
];

if (assetHostname) {
  customRemotePatterns.push({ protocol: 'https', hostname: assetHostname });
}

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.14'],
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
  // Exclude large static assets from serverless function bundles (Vercel 300MB limit)
  outputFileTracingExcludes: {
    '*': [
      './public/images/featured/**',
      './public/images/articles/**',
      './public/uploads/**',
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
            value: 'max-age=63072000; includeSubDomains; preload'
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
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.google.com https://*.googleapis.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://*.unsplash.com https://flagcdn.com https://images.unsplash.com https://*.r2.dev https://*.thenexttrade.com https://cdn.jsdelivr.net; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googleapis.com wss://*.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
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
}

module.exports = withBundleAnalyzer(nextConfig);
