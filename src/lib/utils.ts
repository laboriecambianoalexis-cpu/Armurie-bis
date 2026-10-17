import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderItem } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const moneyFmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money = (n: number) => `$${moneyFmt.format(round2(n))}`

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const orderNo = (n: number) => `N° ${String(n).padStart(4, '0')}`

/** extraDiscount = remise en $ ajoutée à la remise en % (ex. remise partenaire). */
export function computeTotals(items: OrderItem[], discountPct: number, taxPct: number, extraDiscount = 0) {
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0))
  const discount = Math.min(subtotal, round2((subtotal * clamp(discountPct, 0, 100)) / 100 + Math.max(0, extraDiscount)))
  const tax = round2(((subtotal - discount) * Math.max(0, taxPct)) / 100)
  const total = round2(subtotal - discount + tax)
  return { subtotal, discount, tax, total }
}

/** Catégories considérées comme des armes (liste « Armes achetées » de la fiche client). */
export const WEAPON_CATEGORIES = ['Revolvers', 'Pistolets', 'Carabines', 'Fusils', 'Fusils à pompe', 'Armes de jet & blanches']
export const isWeapon = (category?: string) => !!category && WEAPON_CATEGORIES.includes(category)

/** Nom comparable : sans accents, minuscules, espaces simplifiés (détection des doublons). */
export const normName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const isToday = (ts: number) => new Date(ts).toDateString() === new Date().toDateString()

/** Nombre saisi → nombre valide ≥ 0 */
export const toNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
