import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatMs(ms: number, compact = false): string {
  const totalSecs = Math.floor(ms / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  if (compact) {
    if (hours > 0) return `${hours}h ${mins}m`
    if (mins > 0) return `${mins}m`
    return `${secs}s`
  }

  if (hours > 0) return `${hours}h ${String(mins).padStart(2, '0')}m`
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatMsLong(ms: number): string {
  const totalMins = Math.floor(ms / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  if (hours === 0 && mins === 0) return '< 1 min'
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatDate(ts: number): string {
  return format(new Date(ts), 'MMM d, yyyy')
}

export function formatTime(ts: number): string {
  return format(new Date(ts), 'h:mm a')
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr + 'T00:00:00'), 'EEE, MMM d')
}

export function timeAgo(ts: number): string {
  return formatDistanceToNow(new Date(ts), { addSuffix: true })
}

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const PROJECT_COLORS = [
  '#6475f7',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#a78bfa',
  '#f472b6',
  '#fb923c'
]

export const PROJECT_ICONS = [
  '💻', '🎨', '📝', '📊', '🔧', '🚀', '📱', '🎯',
  '📚', '💡', '🌐', '🎵', '📸', '🏗️', '⚡', '🔬'
]
