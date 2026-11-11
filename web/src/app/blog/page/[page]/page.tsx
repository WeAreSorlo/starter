import { PostList } from '@/components/PostList'
import { getPosts } from '@/lib/cms'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

// The blog's later pages, such as /blog/page/2

// Navigations here wait for the content, so the page needs no <Suspense> fallback to show meanwhile
export const instant = false

export async function generateStaticParams() {
  const { lastPage } = (await getPosts(1)).pagination
  // From 1, which redirects to /blog, since Cache Components prerenders at least one
  return Array.from({ length: Math.max(lastPage, 1) }, (_, index) => ({ page: String(index + 1) }))
}

export async function generateMetadata({ params }: PageProps<'/blog/page/[page]'>): Promise<Metadata> {
  return { title: `Blog, page ${(await params).page}` }
}

export default async function BlogPage({ params }: PageProps<'/blog/page/[page]'>) {
  const page = Number((await params).page)
  if (page === 1) permanentRedirect('/blog')
  if (!Number.isInteger(page) || page < 1) notFound()
  return <PostList page={page} />
}
