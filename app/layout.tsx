import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BrowserNotifications } from '@/components/browser-notifications'

import { redirect } from 'next/navigation'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Julie CMS',
  description: 'Manage clients and never miss a follow-up.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {user ? (
          <div className="flex min-h-screen">
            <BrowserNotifications />

            <Sidebar signOutAction={signOut} />

            {/* Main Content */}
            <main className="main-content flex-1">
              {children}
            </main>
          </div>
        ) : (
          <div className="min-h-screen">
            {children}
          </div>
        )}
      </body>
    </html>
  )
}
