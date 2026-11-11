import { revalidateTag } from 'next/cache'
import { Webhook } from 'standardwebhooks'

// The webhook of the CMS's "Revalidate the site" automation, which runs whenever anything is published or unpublished.
// Every read from the CMS is cached under the tag sorlo, so this expires all of it.
export async function POST(request: Request) {
  const body = await request.text()
  try {
    // Throws unless the CMS signed it with the automation's secret, recently
    new Webhook(process.env.SORLO_WEBHOOK_SECRET ?? '').verify(body, Object.fromEntries(request.headers))
  } catch {
    return Response.json({ message: 'The request isn’t signed with SORLO_WEBHOOK_SECRET.' }, { status: 401 })
  }
  // { expire: 0 } rather than 'max', so the next visit waits for the new content rather than getting the old once more
  revalidateTag('sorlo', { expire: 0 })
  return Response.json({ revalidated: true })
}
