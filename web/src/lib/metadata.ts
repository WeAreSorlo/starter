import type { Media } from '@sorlo/sdk'
import type { Metadata } from 'next'

// The metadata of a page or post, from its SEO group, falling back to its title and a description such as an excerpt
export function metadataOf(
  title: string | undefined,
  seo: { title?: string; description?: string; image?: Media | null } | undefined,
  description?: string,
): Metadata {
  const image = seo?.image
  return {
    title: seo?.title || title,
    description: seo?.description || description,
    openGraph: image
      ? {
          images: [
            {
              url: image.url,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
              alt: image.alt ?? '',
            },
          ],
        }
      : undefined,
  }
}
