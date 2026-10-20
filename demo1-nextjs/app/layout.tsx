import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Romby',
}

// No next/font/google here: it downloads fonts at build time, and the demo must work offline.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  )
}
