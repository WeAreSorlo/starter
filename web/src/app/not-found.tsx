import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <section className='prose'>
      <h1>Not found</h1>
      <p>
        There’s no page here. <Link href='/'>Go to the home page</Link>.
      </p>
    </section>
  )
}
