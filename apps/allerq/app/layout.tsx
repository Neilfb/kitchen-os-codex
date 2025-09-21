import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@kitchen-os/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AllerQ',
  description: 'QR allergen menus for safer dining',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}