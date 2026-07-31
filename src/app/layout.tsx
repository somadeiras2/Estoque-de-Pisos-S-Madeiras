import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Estoque Pisos',
  description: 'Sistema de controle de estoque para pisos cerâmicos e porcelanatos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${inter.className} h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
