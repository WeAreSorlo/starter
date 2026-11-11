import './globals.css'
import { PreviewBar } from '@/components/PreviewBar'
import { getSettings } from '@/lib/cms'
import type { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const name = (await getSettings())?.values.name ?? 'Sorlo Starter'
  return { title: { default: name, template: `%s · ${name}` } }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSettings()
  return (
    <html lang='en'>
      <body>
        <PreviewBar />
        <header className='site-header'>
          <Link href='/' className='site-name'>
            {settings?.values.name}
          </Link>
          <nav aria-label='Main'>
            {settings?.values.navigation?.map((item, index) => (
              <Link key={index} href={item.link ?? '/'}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
        <footer className='site-footer'>
          Built with <a href='https://github.com/WeAreSorlo/cms'>Sorlo</a>
        </footer>
      </body>
    </html>
  )
}
