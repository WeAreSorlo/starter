import { CallToAction } from './blocks/CallToAction'
import { FormBlock } from './blocks/FormBlock'
import { Hero } from './blocks/Hero'
import { Picture } from './blocks/Picture'
import { Text } from './blocks/Text'
import type { EntryPages } from '@/sorlo-types'
import type { Draft, With } from '@sorlo/sdk'

// A page's block as a preview reads it, with fields that can be empty, which a live block satisfies too
export type Block = NonNullable<Draft<With<EntryPages, 'blocks'>>['values']['blocks']>[number]
export type BlockOf<Layout extends Block['_layout']> = Extract<Block, { _layout: Layout }>

// Each block's _layout, as the pages type names its layouts, is a component of its own
export function Blocks({ blocks = [] }: { blocks?: Array<Block> }) {
  return blocks.map((block, index) => {
    switch (block._layout) {
      case 'hero':
        return <Hero key={index} block={block} />
      case 'text':
        return <Text key={index} block={block} />
      case 'image':
        return <Picture key={index} block={block} />
      case 'call_to_action':
        return <CallToAction key={index} block={block} />
      case 'form':
        return <FormBlock key={index} block={block} />
    }
  })
}
