'use client'

import Form from '@sorlo/forms'
import type { FormHandle, ValidationReport } from '@sorlo/forms'
import '@sorlo/forms/styles/base.css'
import '@sorlo/forms/styles/layout.css'
import '@sorlo/forms/styles/themes/default.css'
import { SorloError, createClient } from '@sorlo/sdk'
import type { SorloForm } from '@sorlo/sdk'
import { useRef, useState } from 'react'

// A form's fields rendered with Sorlo Forms, which the CMS checks again when it takes the submission
export function CmsForm({ form, url }: { form: SorloForm; url: string }) {
  const ref = useRef<FormHandle>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [state, setState] = useState<'ready' | 'sending' | 'sent'>('ready')
  const [problem, setProblem] = useState('')

  async function send() {
    if (!ref.current?.validate().isValid) return
    setState('sending')
    setProblem('')
    try {
      // Straight from the browser with no key, so each visitor counts against the CMS's rate limit alone
      await createClient({ url })
        .form(form.id)
        .submit({ ...values, _website: honeypot.current?.value ?? '' })
      setState('sent')
    } catch (error) {
      setState('ready')
      if (error instanceof SorloError && error.status === 422) ref.current?.applyReport(error.body as ValidationReport)
      else if (error instanceof SorloError && error.status === 429)
        setProblem('Too many messages from here. Try again later.')
      else setProblem("The message couldn't be sent. Try again.")
    }
  }

  if (state === 'sent') return <p role='status'>Thanks, your message is on its way.</p>
  return (
    <div className='cms-form'>
      <Form ref={ref} className='sorlo-theme-default' schema={form.fields} values={values} onValuesChange={setValues} />
      {/* The honeypot, as the CMS's own embed has it: people never see it, so the CMS keeps a submission that fills
          it in as spam */}
      <div className='honeypot' aria-hidden='true'>
        <label>
          Leave this empty <input ref={honeypot} name='_website' tabIndex={-1} autoComplete='off' />
        </label>
      </div>
      {problem && <p role='alert'>{problem}</p>}
      <button type='button' className='button' onClick={send} disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send'}
      </button>
    </div>
  )
}
