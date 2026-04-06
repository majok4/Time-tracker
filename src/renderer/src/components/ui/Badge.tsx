import { cn } from '../../lib/utils'
import { hexToRgba } from '../../lib/utils'

interface BadgeProps {
  label: string
  color?: string
  className?: string
}

export default function Badge({ label, color = '#6366F1', className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ background: hexToRgba(color, 0.15), color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
