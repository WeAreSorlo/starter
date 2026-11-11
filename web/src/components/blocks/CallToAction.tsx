import type { BlockOf } from '../Blocks'
import Link from 'next/link'

export function CallToAction({ block }: { block: BlockOf<'call_to_action'> }) {
  return (
    <section className='call-to-action'>
      <h2>{block.heading}</h2>
      {block.text && <p>{block.text}</p>}
      {block.link && (
        <Link className='button' href={block.link}>
          {block.label}
        </Link>
      )}
    </section>
  )
}
