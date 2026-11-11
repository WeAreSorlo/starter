import type { Media } from '@sorlo/sdk'
import Image from 'next/image'

// A file from the media library at its own proportions, which Next resizes for each screen
export function CmsImage({
  image,
  sizes = '(max-width: 960px) 100vw, 960px',
  preload,
}: {
  image: Media
  sizes?: string
  preload?: boolean
}) {
  return (
    <Image
      src={image.url}
      width={image.width ?? 1600}
      height={image.height ?? 900}
      alt={image.alt ?? ''}
      sizes={sizes}
      preload={preload}
    />
  )
}
