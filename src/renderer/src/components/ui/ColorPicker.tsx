import { cn } from '../../lib/utils'
import { PROJECT_COLORS } from '../../lib/utils'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110',
            value === color ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
          )}
          style={{
            background: color,
            ringColor: color
          } as React.CSSProperties}
        >
          {value === color && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}
