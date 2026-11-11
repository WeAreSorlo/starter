import { PostList } from '@/components/PostList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog' }

export default function Blog() {
  return <PostList page={1} />
}
