import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none px-3 py-2 pr-8 rounded-lg text-sm border outline-none transition-colors',
              className
            )}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)'
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
