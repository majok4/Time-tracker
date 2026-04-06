import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'text-white',
      secondary: 'border',
      ghost: '',
      danger: ''
    }

    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-3.5 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base'
    }

    const styles = {
      primary: { background: 'var(--accent)', color: 'white' },
      secondary: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' },
      ghost: { color: 'var(--text-secondary)' },
      danger: { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        style={styles[variant]}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
