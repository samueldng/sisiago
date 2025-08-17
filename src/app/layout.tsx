import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { NetworkAlert } from '@/components/NetworkMonitor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SISIAGO - Sistema PDV',
  description: 'Sistema de Ponto de Venda inteligente e mobile-first',
  manifest: '/manifest.json',
  keywords: ['PDV', 'Sistema', 'Vendas', 'Mobile', 'React', 'Next.js'],
  authors: [{ name: 'SISIAGO Team' }],
  creator: 'SISIAGO',
  publisher: 'SISIAGO',
  robots: 'index, follow',
  openGraph: {
    title: 'SISIAGO - Sistema PDV',
    description: 'Sistema de Ponto de Venda inteligente e mobile-first',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              <NetworkAlert />
              {children}
            
            {/* Toast notifications */}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerClassName=""
              containerStyle={{}}
              toastOptions={{
                // Configurações padrão para todos os toasts
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  maxWidth: '500px',
                },
                // Configurações específicas por tipo
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
                loading: {
                  duration: Infinity,
                },
              }}
            />
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}