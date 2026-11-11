import { exitPreview } from '@/app/actions'
import { cacheLife } from 'next/cache'
import { draftMode } from 'next/headers'

// Says when the site is showing drafts, which the editor's Preview button turned on. Cached, since draft mode skips
// caches and so renders it afresh.
export async function PreviewBar() {
  'use cache'
  cacheLife('max')
  if (!(await draftMode()).isEnabled) return null
  return (
    <aside className='preview-bar' role='status'>
      You’re previewing drafts.
      <form action={exitPreview}>
        <button type='submit'>Exit preview</button>
      </form>
    </aside>
  )
}
