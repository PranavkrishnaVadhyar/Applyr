import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk', weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Applyr — Apply with less repetition',
  description: 'Review resume-based answers, fill supported application forms and keep your job search organized.',
  icons: {
    icon: [
      {
        url: '/applyr-mark.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/applyr-mark.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/applyr-mark.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
