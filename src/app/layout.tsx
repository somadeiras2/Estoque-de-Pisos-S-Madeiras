import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Estoque Pisos',
  description: 'Sistema de controle de estoque para pisos cerâmicos e porcelanatos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Estoque Pisos',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} h-full select-none font-sans bg-slate-50 text-slate-800`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
