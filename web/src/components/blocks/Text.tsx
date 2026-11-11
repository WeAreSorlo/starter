import type { BlockOf } from '../Blocks'
import Markdown from 'react-markdown'

export function Text({ block }: { block: BlockOf<'text'> }) {
  return (
    <section className='prose'>
      <Markdown>{block.body}</Markdown>
    </section>
  )
}
