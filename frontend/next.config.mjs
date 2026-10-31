/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.29.47'],
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '716397457965-fu0mp9f7h1j0djfds3clff0psvad46do.apps.googleusercontent.com',
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: process.env.BACKEND_URL
                ? `${process.env.BACKEND_URL}/api/:path*`
                : 'http://localhost:4000/api/:path*',
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
