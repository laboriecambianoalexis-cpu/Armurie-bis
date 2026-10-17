import { create } from 'zustand'
import { supabase } from './db'
import type { OrderItem, Product, Settings } from './types'
import { computeTotals, isWeapon, round2, uid } from './utils'

/* ——— Partenaires & tombola ———
 * Module séparé du store principal : si les tables n'existent pas encore en base,
 * seule cette partie est indisponible (le reste de la caisse fonctionne).
 */

export interface Partner {
  id: string
  name: string
  customPct: number // remise sur la personnalisation (atelier)
  weaponsPct: number // remise sur le prix des armes
  notes: string
}

export interface RaffleEntry {
  id: string
  name: string
  tickets: number
  createdAt: number
}

export interface RaffleDraw {
  id: string
  winner: string
  winnerTickets: number
  totalTickets: number
  participants: number
  prize: string
  createdAt: number
}

const T = { partners: 'armurerie_partners', entries: 'armurerie_raffle_entries', draws: 'armurerie_raffle_draws' } as const

/* eslint-disable @typescript-eslint/no-explicit-any */
const toPartner = (r: any): Partner => ({ id: r.id, name: r.name, customPct: Number(r.custom_pct), weaponsPct: Number(r.weapons_pct), notes: r.notes ?? '' })
const fromPartner = (p: Partner) => ({ id: p.id, name: p.name, custom_pct: p.customPct, weapons_pct: p.weaponsPct, notes: p.notes })
const toEntry = (r: any): RaffleEntry => ({ id: r.id, name: r.name, tickets: Number(r.tickets), createdAt: Date.parse(r.created_at) })
const toDraw = (r: any): RaffleDraw => ({
  id: r.id,
  winner: r.winner,
  winnerTickets: Number(r.winner_tickets),
  totalTickets: Number(r.total_tickets),
  participants: Number(r.participants),
  prize: r.prize ?? '',
  createdAt: Date.parse(r.created_at),
})

interface ExtrasState {
  /** null = pas encore chargé ; false = tables absentes en base */
  available: boolean | null
  partners: Partner[]
  entries: RaffleEntry[]
  draws: RaffleDraw[]
  load: () => Promise<void>
  savePartner: (p: Omit<Partner, 'id'> & { id?: string }) => Promise<void>
  deletePartner: (id: string) => Promise<void>
  addTickets: (name: string, tickets: number) => Promise<void>
  setTickets: (id: string, tickets: number) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  recordDraw: (d: Omit<RaffleDraw, 'id' | 'createdAt'>) => Promise<RaffleDraw | null>
  resetRaffle: () => Promise<void>
}

async function run<T>(q: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await q
  if (error) {
    console.error(error)
    throw new Error(error.message)
  }
  return data
}

const norm = (s: string) => s.trim().replace(/\s+/g, ' ')

export const useExtras = create<ExtrasState>((set, get) => ({
  available: null,
  partners: [],
  entries: [],
  draws: [],

  load: async () => {
    if (!supabase) return set({ available: false })
    const [p, e, d] = await Promise.all([
      supabase.from(T.partners).select('*').order('name'),
      supabase.from(T.entries).select('*').order('created_at'),
      supabase.from(T.draws).select('*').order('created_at', { ascending: false }),
    ])
    if (p.error || e.error || d.error) return set({ available: false })
    set({ available: true, partners: (p.data ?? []).map(toPartner), entries: (e.data ?? []).map(toEntry), draws: (d.data ?? []).map(toDraw) })
  },

  savePartner: async (p) => {
    const partner: Partner = { ...p, name: norm(p.name), id: p.id ?? uid() }
    await run(supabase!.from(T.partners).upsert(fromPartner(partner)))
    set((s) => ({ partners: [...s.partners.filter((x) => x.id !== partner.id), partner].sort((a, b) => a.name.localeCompare(b.name, 'fr')) }))
  },
  deletePartner: async (id) => {
    await run(supabase!.from(T.partners).delete().eq('id', id))
    set((s) => ({ partners: s.partners.filter((x) => x.id !== id) }))
  },

  /** Ajoute des tickets : si le participant existe déjà (même nom), ses tickets s'additionnent. */
  addTickets: async (rawName, tickets) => {
    const name = norm(rawName)
    const existing = get().entries.find((e) => e.name.toLowerCase() === name.toLowerCase())
    if (existing) return get().setTickets(existing.id, existing.tickets + tickets)
    const entry: RaffleEntry = { id: uid(), name, tickets, createdAt: Date.now() }
    await run(supabase!.from(T.entries).insert({ id: entry.id, name, tickets }))
    set((s) => ({ entries: [...s.entries, entry] }))
  },
  setTickets: async (id, tickets) => {
    await run(supabase!.from(T.entries).update({ tickets }).eq('id', id))
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, tickets } : e)) }))
  },
  deleteEntry: async (id) => {
    await run(supabase!.from(T.entries).delete().eq('id', id))
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  },
  recordDraw: async (d) => {
    const draw: RaffleDraw = { ...d, id: uid(), createdAt: Date.now() }
    await run(
      supabase!.from(T.draws).insert({
        id: draw.id,
        winner: d.winner,
        winner_tickets: d.winnerTickets,
        total_tickets: d.totalTickets,
        participants: d.participants,
        prize: d.prize,
      }),
    )
    set((s) => ({ draws: [draw, ...s.draws] }))
    return draw
  },
  /** Nouvelle tombola : vide la liste des participants (l'historique des tirages est conservé). */
  resetRaffle: async () => {
    await run(supabase!.from(T.entries).delete().neq('id', ''))
    set({ entries: [] })
  },
}))

/** Écoute en direct les changements partenaires / tombola des autres caisses. */
export function subscribeExtras(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const debounced = () => {
    clearTimeout(t)
    t = setTimeout(onChange, 250)
  }
  const ch = supabase.channel('armurerie-extras')
  for (const table of Object.values(T)) ch.on('postgres_changes', { event: '*', schema: 'public', table }, debounced)
  ch.subscribe()
  return () => {
    clearTimeout(t)
    supabase!.removeChannel(ch)
  }
}

/** Montant de la remise partenaire sur une note : % personnalisation + % armes. */
export function partnerDiscount(items: OrderItem[], products: Product[], partner: Partner | undefined) {
  if (!partner) return 0
  let sum = 0
  for (const i of items) {
    const cat = products.find((p) => p.id === i.productId)?.category
    const line = i.price * i.qty
    if (cat === 'Personnalisation') sum += (line * partner.customPct) / 100
    else if (isWeapon(cat)) sum += (line * partner.weaponsPct) / 100
  }
  return round2(sum)
}

/** Totaux complets de la note en cours (remise manuelle + remise partenaire + taxe). */
export function cartTotals(cart: { items: OrderItem[]; discountPct: number; partnerId?: string | null }, products: Product[], settings: Settings, partners: Partner[]) {
  const partner = partners.find((p) => p.id === cart.partnerId)
  const pDiscount = partnerDiscount(cart.items, products, partner)
  return { ...computeTotals(cart.items, cart.discountPct, settings.taxPct, pDiscount), partner, partnerDiscount: pDiscount }
}

/** Tirage au sort pondéré : chaque ticket = une chance. */
export function drawWinner(entries: RaffleEntry[]) {
  const total = entries.reduce((s, e) => s + e.tickets, 0)
  if (!total) return null
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  let r = buf[0] % total
  for (const e of entries) {
    if (r < e.tickets) return e
    r -= e.tickets
  }
  return entries[entries.length - 1]
}
