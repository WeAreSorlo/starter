import type { BlockOf } from '../Blocks'
import { CmsForm } from '../CmsForm'
import { getForm } from '@/lib/cms'

// A form from the admin's Forms page, which the block names by its ID
export async function FormBlock({ block }: { block: BlockOf<'form'> }) {
  if (!block.form) return null
  const form = await getForm(block.form)
  return (
    <section className='form-block'>
      {block.heading && <h2>{block.heading}</h2>}
      {form.open ? <CmsForm form={form} url={process.env.SORLO_URL!} /> : <p>This form is closed.</p>}
    </section>
  )
}
