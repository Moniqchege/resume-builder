import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number) {
  if (score >= 85) return 'high'
  if (score >= 65) return 'mid'
  return 'low'
}

export function scoreColor(score: number) {
  if (score >= 85) return '#B8FF00'  // lime
  if (score >= 65) return '#00D4FF'  // cyan
  return '#FF4D6D'                   // red
}

export function scoreLabel(score: number) {
  if (score >= 85) return 'ATS READY'
  if (score >= 65) return 'REVIEW'
  return 'NEEDS WORK'
}

export function scorePillClass(score: number) {
  if (score >= 85) return 'pill-success'
  if (score >= 65) return 'pill-warning'
  return 'pill-danger'
}
