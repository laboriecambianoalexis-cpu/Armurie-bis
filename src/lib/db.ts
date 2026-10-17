import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { SEED_PRODUCTS } from './seed'
import { CATEGORIES, type Client, type Order, type OrderItem, type OrderStatus, type Product, type Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null = mode local (pas de Supabase configuré) : tout reste dans le navigateur. */
export const supabase = url && key ? createClient(url, key) : null
export const hasDb = !!supabase

/** Tables préfixées : l'armurerie partage le projet Supabase de l'EMS. */
const T = {
  products: 'armurerie_products',
  clients: 'armurerie_clients',
  orders: 'armurerie_orders',
  settings: 'armurerie_settings',
} as const

// ——— Conversion lignes SQL (snake_case) <-> objets de l'app ———
/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any) => Number(v ?? 0)

const toProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: num(r.price),
  stock: r.stock,
  image: r.image ?? undefined,
  craftTax: num(r.craft_tax),
  recipe: (r.recipe ?? {}) as Record<string, number>,
  ingredients: Array.isArray(r.craft_recipe) && r.craft_recipe.length > 0
    ? r.craft_recipe
    : Array.isArray(r.ingredients) && r.ingredients.length > 0
      ? r.ingredients
      : Object.entries((r.recipe ?? {}) as Record<string, number>).map(([materialId, qty]) => ({ materialId, qty: Number(qty) })),
})
const fromProduct = (p: Product) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  stock: p.stock,
  image: p.image ?? null,
  craft_tax: p.craftTax ?? 0,
  recipe: p.recipe ?? Object.fromEntries((p.ingredients ?? []).map(({ materialId, qty }) => [materialId, qty])),
  ingredients: p.ingredients ?? Object.entries(p.recipe ?? {}).map(([materialId, qty]) => ({ materialId, qty })),
  craft_recipe: p.ingredients ?? Object.entries(p.recipe ?? {}).map(([materialId, qty]) => ({ materialId, qty })),
})

const toClient = (r: any): Client => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  license: r.license,
  licenseValid: r.license_valid,
  notes: r.notes,
  createdAt: Date.parse(r.created_at),
})
const fromClient = (c: Client) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  license: c.license,
  license_valid: c.licenseValid,
  notes: c.notes,
  created_at: new Date(c.createdAt).toISOString(),
})

const toOrder = (r: any): Order => {
  const hasAllocationSnapshot = num(r.caisse_part) !== 0 || num(r.vendor_part) !== 0 || num(r.craft_cost) !== 0 || (Array.isArray(r.items) && r.items.some((item: any) => item.caissePart !== undefined || item.vendorPart !== undefined || item.craftCost !== undefined))
  return {
  id: r.id,
  number: num(r.number),
  clientId: r.client_id,
  clientName: r.client_name,
  items: r.items as OrderItem[],
  discountPct: num(r.discount_pct),
  taxPct: num(r.tax_pct),
  subtotal: num(r.subtotal),
  discount: num(r.discount),
  tax: num(r.tax),
  total: num(r.total),
  received: num(r.received),
  change: num(r.change),
  status: r.status as OrderStatus,
  note: r.note,
  createdAt: Date.parse(r.created_at),
  partnerName: r.partner_name ?? null,
  partnerDiscount: num(r.partner_discount),
  seller: r.seller ?? null,
  caissePart: hasAllocationSnapshot ? num(r.caisse_part) : undefined,
  vendorPart: hasAllocationSnapshot ? num(r.vendor_part) : undefined,
  craftCost: hasAllocationSnapshot ? num(r.craft_cost) : undefined,
  vendorId: r.vendor_id ?? null,
  }
}
const fromOrder = (o: Omit<Order, 'number'> & { number?: number }) => ({
  id: o.id,
  ...(o.number ? { number: o.number } : {}),
  client_id: o.clientId,
  client_name: o.clientName,
  items: o.items,
  discount_pct: o.discountPct,
  tax_pct: o.taxPct,
  subtotal: o.subtotal,
  discount: o.discount,
  tax: o.tax,
  total: o.total,
  received: o.received,
  change: o.change,
  status: o.status,
  note: o.note,
  ...(o.caissePart !== undefined ? { caisse_part: o.caissePart } : {}),
  ...(o.vendorPart !== undefined ? { vendor_part: o.vendorPart } : {}),
  ...(o.craftCost !== undefined ? { craft_cost: o.craftCost } : {}),
  vendor_id: o.vendorId ?? null,
  created_at: new Date(o.createdAt).toISOString(),
  // colonnes ajoutées avec les partenaires : envoyées seulement si utilisées
  ...(o.partnerName ? { partner_name: o.partnerName, partner_discount: o.partnerDiscount ?? 0 } : {}),
  ...(o.seller ? { seller: o.seller } : {}),
})

const SEED_ORDER = new Map(SEED_PRODUCTS.map((p, i) => [p.id, i]))
const seedRank = (id: string) => SEED_ORDER.get(id) ?? 9999

const toSettings = (r: any): Settings => ({ shopName: r.shop_name, town: r.town, taxPct: num(r.tax_pct) })

function fail(error: { message: string } | null) {
  if (!error) return false
  console.error(error)
  toast.error(`Base de données : ${error.message}`)
  return true
}

export interface Snapshot {
  products: Product[]
  clients: Client[]
  orders: Order[]
  settings: Settings | null
}

export async function fetchAll(): Promise<Snapshot | null> {
  if (!supabase) return null
  const [p, c, o, s] = await Promise.all([
    supabase.from(T.products).select('*').order('created_at'),
    supabase.from(T.clients).select('*').order('created_at', { ascending: false }),
    supabase.from(T.orders).select('*').order('number', { ascending: false }),
    supabase.from(T.settings).select('*').eq('id', 1).maybeSingle(),
  ])
  if (fail(p.error) || fail(c.error) || fail(o.error) || fail(s.error)) return null
  return {
    products: (p.data ?? [])
      .map(toProduct)
      // ordre de la grille officielle (seed), puis alphabétique pour les articles ajoutés à la main
      .sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || seedRank(a.id) - seedRank(b.id) || a.name.localeCompare(b.name, 'fr')),
    clients: (c.data ?? []).map(toClient),
    orders: (o.data ?? []).map(toOrder),
    settings: s.data ? toSettings(s.data) : null,
  }
}

/** Écoute les changements (autres caisses) et appelle onChange. Renvoie la fonction de désabonnement. */
export function subscribe(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const debounced = () => {
    clearTimeout(t)
    t = setTimeout(onChange, 250)
  }
  const ch = supabase.channel('armurerie')
  for (const table of Object.values(T)) ch.on('postgres_changes', { event: '*', schema: 'public', table }, debounced)
  ch.subscribe()
  return () => {
    clearTimeout(t)
    supabase.removeChannel(ch)
  }
}

// Toutes les écritures : no-op en mode local.
export const db = {
  async upsertProduct(p: Product) {
    if (supabase) fail((await supabase.from(T.products).upsert(fromProduct(p))).error)
  },
  async deleteProduct(id: string) {
    if (supabase) fail((await supabase.from(T.products).delete().eq('id', id)).error)
  },
  async upsertClient(c: Client) {
    if (supabase) fail((await supabase.from(T.clients).upsert(fromClient(c))).error)
  },
  async renameClientOrders(clientId: string, name: string) {
    if (supabase) fail((await supabase.from(T.orders).update({ client_name: name }).eq('client_id', clientId)).error)
  },
  /** Fusion : toutes les ventes de `from` passent sur `to`, puis `from` est supprimé. */
  async mergeClients(from: string, to: string, name: string) {
    if (!supabase) return
    if (fail((await supabase.from(T.orders).update({ client_id: to, client_name: name }).eq('client_id', from)).error)) return
    fail((await supabase.from(T.clients).delete().eq('id', from)).error)
  },
  async deleteClient(id: string) {
    if (supabase) fail((await supabase.from(T.clients).delete().eq('id', id)).error)
  },
  /** Insère la commande ; la base attribue le numéro. */
  async insertOrder(o: Omit<Order, 'number'>): Promise<Order | null> {
    if (!supabase) return null
    const { data, error } = await supabase.from(T.orders).insert(fromOrder(o)).select().single()
    return fail(error) ? null : toOrder(data)
  },
  async updateOrder(id: string, patch: { status: OrderStatus; received: number }) {
    if (supabase) fail((await supabase.from(T.orders).update(patch).eq('id', id)).error)
  },
  async deleteOrder(id: string) {
    if (supabase) fail((await supabase.from(T.orders).delete().eq('id', id)).error)
  },
  async saveSettings(s: Settings) {
    if (supabase) fail((await supabase.from(T.settings).upsert({ id: 1, shop_name: s.shopName, town: s.town, tax_pct: s.taxPct })).error)
  },
  /** Remplace tout le contenu de la base (import d'une sauvegarde / remise à zéro). */
  async replaceAll(d: { products: Product[]; clients: Client[]; orders: Order[]; settings: Settings }) {
    if (!supabase) return
    for (const t of ['orders', 'clients', 'products'] as const)
      if (fail((await supabase.from(T[t]).delete().neq('id', '')).error)) return
    if (d.products.length && fail((await supabase.from(T.products).insert(d.products.map(fromProduct))).error)) return
    if (d.clients.length && fail((await supabase.from(T.clients).insert(d.clients.map(fromClient))).error)) return
    if (d.orders.length && fail((await supabase.from(T.orders).insert(d.orders.map(fromOrder))).error)) return
    await db.saveSettings(d.settings)
    fail((await supabase.rpc('armurerie_reset_order_number')).error)
  },
}
