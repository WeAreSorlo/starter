import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, timingSafeEqual } from 'node:crypto'

// Where the editor's Preview button lands, as previews in cms/sorlo.config.ts sends it:
// /api/preview?secret=…&path=/blog/hello. It turns on draft mode, in which the site reads drafts, then goes to the path.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? ''
  // Only a path on this site, so the route can't send anyone elsewhere
  const local = path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
  if (!matches(searchParams.get('secret'), process.env.PREVIEW_SECRET) || !local) {
    return new Response('This preview link is wrong, or the site has no PREVIEW_SECRET.', { status: 401 })
  }
  ;(await draftMode()).enable()
  redirect(path)
}

// Compares in constant time, so the reply's timing doesn't give the secret away
function matches(sent: string | null, secret: string | undefined) {
  if (!sent || !secret) return false
  const digest = (text: string) => createHash('sha256').update(text).digest()
  return timingSafeEqual(digest(sent), digest(secret))
}
