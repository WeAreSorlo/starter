import { Blocks } from '@/components/Blocks'
import { getPage } from '@/lib/cms'
import { metadataOf } from '@/lib/metadata'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// The page whose slug is home
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home')
  // The site's name alone, from the layout, unless the SEO group gives the home page a title of its own
  const { title, ...metadata } = metadataOf(undefined, page?.values.seo)
  return title ? { ...metadata, title: { absolute: String(title) } } : metadata
}

export default async function Home() {
  const page = await getPage('home')
  if (!page) notFound()
  return <Blocks blocks={page.values.blocks} />
}
