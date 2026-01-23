import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
