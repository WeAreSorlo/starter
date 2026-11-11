import { defineConfig } from '@sorlo/cms'
import type { MailOptions } from '@sorlo/cms'
import { FSDriver } from 'flydrive/drivers/fs'
import { S3Driver } from 'flydrive/drivers/s3'
import nodemailer from 'nodemailer'

// The Docker image sets it. sorlo dev leaves it unset.
const production = process.env.NODE_ENV === 'production'

export default defineConfig({
  database: { url: process.env.DATABASE_URL ?? 'postgres://sorlo:sorlo@localhost:5432/sorlo_starter' },
  // The admin's public address, which emailed links and file URLs start from
  url: process.env.APP_URL,
  storage: {
    // The bucket once S3_BUCKET is set, and storage/ beside this file otherwise. Each file's row records the disk it went
    // to, so both stay set up.
    default: process.env.S3_BUCKET ? 's3' : 'local',
    services: {
      local: () => new FSDriver({ location: new URL('./storage/', import.meta.url), visibility: 'public' }),
      s3: () =>
        new S3Driver({
          credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
          region: process.env.S3_REGION!,
          // For R2, MinIO and other services that speak S3
          endpoint: process.env.S3_ENDPOINT,
          bucket: process.env.S3_BUCKET!,
          // The CMS serves every file itself, so the bucket stays private and needs no ACLs, which R2 and new AWS
          // buckets don't take
          visibility: 'private',
          supportsACL: false,
        }),
    },
  },
  mail: mail(),
  // Lets the revalidate webhook reach the site on this machine in development
  webhooks: production ? undefined : { allowNetworks: ['127.0.0.0/8', '::1'] },
  // The editor's Preview button, which opens an entry's saved draft on the site, once it has a secret for it
  previews: process.env.PREVIEW_SECRET
    ? {
        pages: ({ entry }) => (entry.uri ? preview(entry.uri === 'home' ? '/' : `/${entry.uri}`) : undefined),
        posts: ({ entry }) => (entry.slug ? preview(`/blog/${entry.slug}`) : undefined),
      }
    : undefined,
})

// The site's preview route, which checks the secret, turns on Next's draft mode and goes to the path
function preview(path: string) {
  const url = new URL('/api/preview', process.env.WEB_URL ?? 'http://localhost:3000')
  url.search = new URLSearchParams({ secret: process.env.PREVIEW_SECRET!, path }).toString()
  return url.href
}

// Email through any SMTP service once SMTP_URL is set. Without it, sorlo dev prints each email here, and production
// sends none, so the admin shows invite and reset links once rather than the host's logs keeping them.
function mail(): MailOptions | undefined {
  const from = process.env.MAIL_FROM ?? 'Sorlo <cms@example.com>'
  if (process.env.SMTP_URL) {
    const transporter = nodemailer.createTransport(process.env.SMTP_URL)
    return { from, send: (message) => transporter.sendMail(message) }
  }
  if (production) return undefined
  return {
    from,
    send: async (message) => console.log(`Email to ${message.to.join(', ')}: ${message.subject}\n\n${message.text}\n`),
  }
}
