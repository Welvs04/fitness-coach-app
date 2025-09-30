import type { Metadata } from 'next'
import './globals.css' // This imports the default styling provided by Next.js

export const metadata: Metadata = {
  title: 'Fitness Coach Manager',
  description: 'Manage your clients with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}