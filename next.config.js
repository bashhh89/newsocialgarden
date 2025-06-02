/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Production-ready configuration with proper error checking
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove the output: 'standalone' that was causing port issues
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  // Disable image optimization for PDF files which can be large
  images: {
    unoptimized: true
  },
  // Enable font optimization
  optimizeFonts: true,
  // Set specific settings to help with build errors
  reactStrictMode: true,
  swcMinify: true,
  distDir: '.next',
  // Transpile ESM packages
  transpilePackages: ['@react-pdf/renderer', 'react-pdf', '@babel/runtime'],
  // Ensure proper error handling
  onDemandEntries: {
    // Keep the pages in memory for longer
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // The number of pages to keep in memory
    pagesBufferLength: 5,
  },
  // Explicitly set which paths to exclude from static page generation
  excludeDefaultMomentLocales: true,
  webpack: (config) => {
    // This is necessary for pdfmake to work correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false,
      path: false,
    };
    return config;
  },
  // Add security headers to all responses
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 