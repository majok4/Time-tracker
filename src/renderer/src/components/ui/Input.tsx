import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors',
            'focus:ring-1',
            className
          )}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            borderColor: error ? 'var(--danger)' : 'var(--border)',
          } as React.CSSProperties}
          {...props}
        />
        {error && (
          <span className="text-xs" style={{ color: 'var(--danger)' }}>
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
