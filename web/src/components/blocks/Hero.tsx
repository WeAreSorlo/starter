import type { BlockOf } from '../Blocks'
import { CmsImage } from '../CmsImage'

export function Hero({ block }: { block: BlockOf<'hero'> }) {
  return (
    <section className='hero'>
      {block.image && <CmsImage image={block.image} sizes='100vw' preload />}
      <div className='hero-text'>
        <h1>{block.heading}</h1>
        {block.text && <p>{block.text}</p>}
      </div>
    </section>
  )
}
