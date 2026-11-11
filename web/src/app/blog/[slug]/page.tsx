import { CmsImage } from '@/components/CmsImage'
import { PostDate } from '@/components/PostDate'
import { getPost, getPostSlugs } from '@/lib/cms'
import { metadataOf } from '@/lib/metadata'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'

// Navigations here wait for the content, so the page needs no <Suspense> fallback to show meanwhile
export const instant = false

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  // Cache Components prerenders at least one, so a blog with no posts prerenders a 404
  return (slugs.length ? slugs : ['none']).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getPost((await params).slug)
  return post ? metadataOf(post.values.title, post.values.seo, post.values.excerpt) : {}
}

export default async function Post({ params }: PageProps<'/blog/[slug]'>) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  const { title, published_at, author, cover, body } = post.values
  return (
    <article className='post'>
      <h1>{title}</h1>
      <p className='meta'>
        <PostDate date={published_at} />
        {author && <> · {author.values.name}</>}
      </p>
      {cover && <CmsImage image={cover} preload />}
      <div className='prose'>
        <Markdown>{body}</Markdown>
      </div>
      {author && (
        <aside className='author'>
          {author.values.avatar && <CmsImage image={author.values.avatar} sizes='64px' />}
          <p>
            <strong>{author.values.name}</strong> {author.values.bio}
          </p>
        </aside>
      )}
    </article>
  )
}
