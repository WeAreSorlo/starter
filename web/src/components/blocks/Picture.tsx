import type { BlockOf } from '../Blocks'
import { CmsImage } from '../CmsImage'

// An image block. Its alt text and caption are the file's, from the media library.
export function Picture({ block }: { block: BlockOf<'image'> }) {
  if (!block.image) return null
  return (
    <figure>
      <CmsImage image={block.image} />
      {block.image.caption && <figcaption>{block.image.caption}</figcaption>}
    </figure>
  )
}
