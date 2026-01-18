'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  User,
  FileCheck,
  Search,
  ClipboardList,
  Calendar,
  DollarSign,
  PlusCircle,
  Users,
  CheckSquare,
  BarChart3,
} from 'lucide-react'

interface SidebarProps {
  userType: 'therapist' | 'organizer' | 'admin'
}

const therapistNavigation = [
  { name: 'Dashboard', href: '/therapist', icon: Home },
  { name: 'My Profile', href: '/therapist/profile', icon: User },
  { name: 'Credentials', href: '/therapist/credentials', icon: FileCheck },
  { name: 'Find Shifts', href: '/therapist/shifts', icon: Search },
  { name: 'My Applications', href: '/therapist/applications', icon: ClipboardList },
  { name: 'My Bookings', href: '/therapist/bookings', icon: Calendar },
  { name: 'Earnings', href: '/therapist/earnings', icon: DollarSign },
]

const organizerNavigation = [
  { name: 'Dashboard', href: '/organizer', icon: Home },
  { name: 'Organization Profile', href: '/organizer/profile', icon: User },
  { name: 'Post New Shift', href: '/organizer/shifts/new', icon: PlusCircle },
  { name: 'My Shifts', href: '/organizer/shifts', icon: ClipboardList },
  { name: 'Bookings', href: '/organizer/bookings', icon: Calendar },
  { name: 'Payments', href: '/organizer/payments', icon: DollarSign },
]

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Verifications', href: '/admin/verifications', icon: CheckSquare },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Transactions', href: '/admin/transactions', icon: BarChart3 },
]

export function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname()

  const navigation =
    userType === 'therapist'
      ? therapistNavigation
      : userType === 'organizer'
      ? organizerNavigation
      : adminNavigation

  const brandColor =
    userType === 'therapist'
      ? 'text-primary-600'
      : userType === 'organizer'
      ? 'text-secondary-600'
      : 'text-purple-600'

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className={cn('text-xl font-bold', brandColor)}>
            TherapistConnect
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  // For dashboard (root paths like /therapist, /organizer), only match exactly
                  // For other items, also match child routes
                  const isDashboard = item.href === '/therapist' || item.href === '/organizer' || item.href === '/admin'
                  const isActive = isDashboard
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6',
                          isActive
                            ? 'bg-gray-100 text-primary-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
