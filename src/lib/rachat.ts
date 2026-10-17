import { create } from 'zustand'
import { supabase } from './db'
import { round2, uid } from './utils'

/* ——— Rachat d'armes d'occasion ———
 * On rachète une arme 70 % du prix catalogue, on la revend 90 %.
 * Chaque arme rachetée = une ligne (en stock tant qu'elle n'est pas revendue).
 */

export const BUY_RATE = 0.7
export const SELL_RATE = 0.9
export const buyPriceFor = (price: number) => round2(price * BUY_RATE)
export const sellPriceFor = (price: number) => round2(price * SELL_RATE)

export interface Buyback {
  id: string
  productId: string | null
  name: string
  buyPrice: number
  sellPrice: number
  boughtFrom: string
  boughtBy: string | null
  note: string
  boughtAt: number
  soldAt: number | null
  soldTo: string | null
  soldBy: string | null
  soldPrice: number | null
}

const TABLE = 'armurerie_buyback'

/* eslint-disable @typescript-eslint/no-explicit-any */
const toBuyback = (r: any): Buyback => ({
  id: r.id,
  productId: r.product_id ?? null,
  name: r.name,
  buyPrice: Number(r.buy_price),
  sellPrice: Number(r.sell_price),
  boughtFrom: r.bought_from ?? '',
  boughtBy: r.bought_by ?? null,
  note: r.note ?? '',
  boughtAt: Date.parse(r.bought_at),
  soldAt: r.sold_at ? Date.parse(r.sold_at) : null,
  soldTo: r.sold_to ?? null,
  soldBy: r.sold_by ?? null,
  soldPrice: r.sold_price == null ? null : Number(r.sold_price),
})

interface RachatState {
  available: boolean | null
  items: Buyback[]
  load: () => Promise<void>
  buy: (b: { productId: string | null; name: string; buyPrice: number; sellPrice: number; boughtFrom: string; boughtBy: string | null; note: string }) => Promise<void>
  sell: (id: string, s: { soldTo: string; soldBy: string | null; soldPrice: number }) => Promise<void>
  unsell: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useRachat = create<RachatState>((set) => ({
  available: null,
  items: [],
  load: async () => {
    if (!supabase) return set({ available: false })
    const { data, error } = await supabase.from(TABLE).select('*').order('bought_at', { ascending: false })
    if (error) return set({ available: false })
    set({ available: true, items: (data ?? []).map(toBuyback) })
  },
  buy: async (b) => {
    const item: Buyback = { ...b, id: uid(), buyPrice: round2(b.buyPrice), sellPrice: round2(b.sellPrice), boughtAt: Date.now(), soldAt: null, soldTo: null, soldBy: null, soldPrice: null }
    const { error } = await supabase!.from(TABLE).insert({
      id: item.id,
      product_id: item.productId,
      name: item.name,
      buy_price: item.buyPrice,
      sell_price: item.sellPrice,
      bought_from: item.boughtFrom,
      bought_by: item.boughtBy,
      note: item.note,
    })
    if (error) throw new Error(error.message)
    set((s) => ({ items: [item, ...s.items] }))
  },
  sell: async (id, v) => {
    const soldAt = Date.now()
    const soldPrice = round2(v.soldPrice)
    const { error } = await supabase!.from(TABLE).update({ sold_at: new Date(soldAt).toISOString(), sold_to: v.soldTo, sold_by: v.soldBy, sold_price: soldPrice }).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, soldAt, soldTo: v.soldTo, soldBy: v.soldBy, soldPrice } : x)) }))
  },
  unsell: async (id) => {
    const { error } = await supabase!.from(TABLE).update({ sold_at: null, sold_to: null, sold_by: null, sold_price: null }).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, soldAt: null, soldTo: null, soldBy: null, soldPrice: null } : x)) }))
  },
  remove: async (id) => {
    const { error } = await supabase!.from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }))
  },
}))

export function subscribeRachat(onChange: () => void) {
  if (!supabase) return () => {}
  const ch = supabase.channel('armurerie-buyback').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange).subscribe()
  return () => {
    supabase!.removeChannel(ch)
  }
}
