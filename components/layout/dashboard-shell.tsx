'use client'

import { ReactNode } from 'react'
import { MobileNavProvider } from './mobile-nav-context'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'

interface DashboardShellProps {
  children: ReactNode
  userType: 'therapist' | 'organizer' | 'admin'
  user: {
    id: string
    email: string
    full_name: string | null
    user_type: 'therapist' | 'organizer' | 'admin'
  }
}

export function DashboardShell({ children, userType, user }: DashboardShellProps) {
  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar userType={userType} />
        <div className="lg:pl-64">
          <Navbar user={user} />
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  )
}
