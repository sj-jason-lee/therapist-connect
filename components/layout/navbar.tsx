'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileNav } from './mobile-nav-context'

interface NavbarProps {
  user: {
    id: string
    email: string
    full_name: string | null
    user_type: 'therapist' | 'organizer' | 'admin'
  }
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { toggle: toggleMobileMenu } = useMobileNav()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userTypeLabel =
    user.user_type === 'therapist'
      ? 'Athletic Therapist'
      : user.user_type === 'organizer'
      ? 'Event Organizer'
      : 'Administrator'

  return (
    <nav className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={toggleMobileMenu}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 flex items-center p-1.5"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-medium text-gray-900" aria-hidden="true">
                  {user.full_name || user.email}
                </span>
                <ChevronDown className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{userTypeLabel}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push(`/${user.user_type}/profile`)
                    }}
                    className="w-full flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Your Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
