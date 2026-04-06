import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full rounded-2xl border shadow-2xl animate-slide-up',
          sizes[size],
          className
        )}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-hover"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
