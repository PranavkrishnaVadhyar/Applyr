import type { Metadata } from 'next'
import { Syne, IBM_Plex_Mono, Orbitron } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const syneFont = Syne({ subsets: ["latin"], variable: '--font-syne', weight: ['400', '600', '700', '800'] });
const ibmPlexFont = IBM_Plex_Mono({ subsets: ["latin"], variable: '--font-ibm-plex-mono', weight: ['400', '500', '600', '700'] });
const orbitronFont = Orbitron({ subsets: ["latin"], variable: '--font-orbitron', weight: ['400', '700', '900'] });

export const metadata: Metadata = {
  title: 'Applyr - AI Job Application Automation',
  description: 'Automate your job applications with AI-powered extraction and management tools',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${syneFont.variable} ${ibmPlexFont.variable} ${orbitronFont.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
