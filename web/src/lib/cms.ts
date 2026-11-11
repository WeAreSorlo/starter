import { createClient } from '@sorlo/sdk'
import { cacheLife, cacheTag } from 'next/cache'
import { draftMode } from 'next/headers'

// Everything the site reads from the CMS. Each function is cached under the tag sorlo, which /api/revalidate expires
// when anything is published. Draft mode, which the editor's Preview button turns on, skips the cache and reads drafts.

// The CMS's client for this request: drafts with the preview key in draft mode, or what's live
async function cms() {
  const preview = (await draftMode()).isEnabled
  return createClient({
    url: process.env.SORLO_URL!,
    token: preview ? process.env.SORLO_PREVIEW_TOKEN : process.env.SORLO_TOKEN,
    preview,
    // Past Next's fetch cache, which keeps replies between builds without the sorlo tag, so only the functions below
    // cache, and a publish reaches everything they hold
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
  })
}

export const postsPerPage = 3

export async function getSettings() {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await cms()).entries('settings').first()
}

// A page by its uri, such as about/team. The home page's is home.
export async function getPage(uri: string) {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await cms()).entries('pages').where('uri', '=', uri).with('blocks', 'seo').first()
}

export async function getPageUris() {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await (await cms()).entries('pages').all()).flatMap((page) => page.uri ?? [])
}

// A page of posts, newest first
export async function getPosts(page: number) {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await cms())
    .entries('posts')
    .with('author', 'cover')
    .orderBy('values.published_at', 'desc')
    .paginate(postsPerPage, page)
}

export async function getPost(slug: string) {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await cms()).entries('posts').where('slug', '=', slug).with('author', 'cover', 'seo').first()
}

export async function getPostSlugs() {
  'use cache'
  cacheTag('sorlo')
  cacheLife('max')
  return (await (await cms()).entries('posts').all()).flatMap((post) => post.slug ?? [])
}

// A form by its ID, as a page's form block holds it
export async function getForm(id: string) {
  'use cache'
  cacheTag('sorlo')
  // Changing a form publishes nothing, so a form's changes show within a few minutes rather than at the next publish
  cacheLife('minutes')
  return (await cms()).form(id).get()
}
