import { CmsImage } from './CmsImage'
import { PostDate } from './PostDate'
import { getPosts } from '@/lib/cms'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// One page of the blog, newest first, with links to the pages either side
export async function PostList({ page }: { page: number }) {
  const { data: posts, pagination } = await getPosts(page)
  if (page > pagination.lastPage && page > 1) notFound()
  return (
    <>
      <h1>Blog</h1>
      <ul className='posts'>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`}>
              {post.values.cover && <CmsImage image={post.values.cover} sizes='(max-width: 960px) 100vw, 300px' />}
              <h2>{post.values.title}</h2>
            </Link>
            <p className='meta'>
              <PostDate date={post.values.published_at} />
              {post.values.author && <> · {post.values.author.values.name}</>}
            </p>
            {post.values.excerpt && <p>{post.values.excerpt}</p>}
          </li>
        ))}
      </ul>
      <nav className='pagination' aria-label='Pages of posts'>
        {page > 1 && <Link href={page === 2 ? '/blog' : `/blog/page/${page - 1}`}>← Newer posts</Link>}
        {page < pagination.lastPage && <Link href={`/blog/page/${page + 1}`}>Older posts →</Link>}
      </nav>
    </>
  )
}
