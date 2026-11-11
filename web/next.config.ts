import type { NextConfig } from 'next'

const cms = new URL(process.env.SORLO_URL ?? 'http://localhost:4100')

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Files from the CMS's media library, which its url, APP_URL, puts in each file's address
    remotePatterns: [new URL('/media/**', cms)],
    // A CMS on this machine, as in development, whose images Next won't fetch otherwise. The pattern above still
    // limits it to the CMS's media.
    dangerouslyAllowLocalIP: ['localhost', '127.0.0.1', '[::1]'].includes(cms.hostname),
  },
}

export default nextConfig
