'use server'

import { draftMode } from 'next/headers'

// Leaves draft mode. Deleting its cookie in a Server Action renders the page again, showing what's live.
export async function exitPreview() {
  ;(await draftMode()).disable()
}
