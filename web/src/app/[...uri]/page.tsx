import { Blocks } from '@/components/Blocks'
import { getPage, getPageUris } from '@/lib/cms'
import { metadataOf } from '@/lib/metadata'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

// Every page but home, at its uri, such as /about/team

// Navigations here wait for the content, so the page needs no <Suspense> fallback to show meanwhile
export const instant = false

export async function generateStaticParams() {
  const uris = await getPageUris()
  // Cache Components prerenders at least one, and home, which redirects to /, will do when there are none
  return (uris.length ? uris : ['home']).map((uri) => ({ uri: uri.split('/') }))
}

export async function generateMetadata({ params }: PageProps<'/[...uri]'>): Promise<Metadata> {
  const page = await getPage((await params).uri.join('/'))
  return page ? metadataOf(page.values.title, page.values.seo) : {}
}

export default async function Page({ params }: PageProps<'/[...uri]'>) {
  const uri = (await params).uri.join('/')
  if (uri === 'home') permanentRedirect('/')
  const page = await getPage(uri)
  if (!page) notFound()
  return <Blocks blocks={page.values.blocks} />
}
