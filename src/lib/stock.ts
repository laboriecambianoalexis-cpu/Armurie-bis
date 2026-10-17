import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hasDb, supabase } from './db'
import type { OrderItem, Product } from './types'
import { round2 } from './utils'

/* ——— Stock de matières premières (cuir, planches, fer, plomb…) ———
 * Chaque vente consomme la recette des articles ; alerte quand une matière passe sous son seuil critique.
 * La vente n'est jamais bloquée (on peut encaisser même à 0).
 */

export interface Material {
  id: string
  name: string
  stock: number
  minStock: number
  /** Champ de compatibilité avec les migrations SQL existantes. */
  threshold: number
  unitCost: number
  position: number
}

const TABLE = 'armurerie_materials'

const LOCAL_MATERIALS: Material[] = [
  { id: 'cuir', name: 'Cuir', stock: 105, minStock: 10, threshold: 10, unitCost: 0, position: 1 },
  { id: 'planches', name: 'Pile de planches', stock: 534, minStock: 100, threshold: 100, unitCost: 0, position: 2 },
  { id: 'fer', name: 'Fer', stock: 514, minStock: 100, threshold: 100, unitCost: 0, position: 3 },
  { id: 'plomb', name: 'Plomb', stock: 0, minStock: 100, threshold: 100, unitCost: 0.1, position: 4 },
  { id: 'soufre', name: 'Soufre', stock: 0, minStock: 100, threshold: 100, unitCost: 0.1, position: 5 },
  { id: 'graisse', name: "Graisse d'animal", stock: 26, minStock: 5, threshold: 5, unitCost: 0, position: 6 },
  { id: 'coton', name: 'Coton', stock: 46, minStock: 10, threshold: 10, unitCost: 0, position: 7 },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
const toMaterial = (r: any): Material => ({
  id: r.id,
  name: r.name,
  stock: Number(r.stock),
  minStock: Number(r.min_stock ?? r.threshold ?? 0),
  threshold: Number(r.min_stock ?? r.threshold ?? 0),
  unitCost: Number(r.unit_cost ?? 0),
  position: Number(r.position),
})

interface StockState {
  available: boolean | null
  materials: Material[]
  load: () => Promise<void>
  /** applique un mouvement (+ réception, − consommation) en base et localement */
  adjust: (id: string, delta: number) => Promise<void>
  save: (m: Material) => Promise<void>
  remove: (id: string) => Promise<void>
  replaceAll: (materials: Material[]) => Promise<void>
}

export const useStock = create<StockState>()(persist((set) => ({
  available: !hasDb,
  materials: LOCAL_MATERIALS,
  load: async () => {
    if (!supabase) {
      set({ available: true })
      return
    }
    const { data, error } = await supabase.from(TABLE).select('*').order('position')
    if (error) {
      set({ available: false })
      return
    }
    set({ available: true, materials: (data ?? []).map(toMaterial) })
  },
  adjust: async (id, delta) => {
    if (!delta) return
    set((s) => ({ materials: s.materials.map((m) => (m.id === id ? { ...m, stock: Math.max(0, round2(m.stock + delta)) } : m)) }))
    if (!supabase) return
    const { error } = await supabase.rpc('armurerie_adjust_material', { p_id: id, p_delta: delta })
    if (error) toast.error(`Stock : ${error.message}`)
  },
  save: async (m) => {
    const material = { ...m, minStock: m.minStock ?? m.threshold, threshold: m.minStock ?? m.threshold }
    if (supabase) {
      const { error } = await supabase.from(TABLE).upsert({ id: material.id, name: material.name, stock: material.stock, threshold: material.minStock, unit_cost: material.unitCost, position: material.position })
      if (error) throw new Error(error.message)
    }
    set((s) => ({ materials: [...s.materials.filter((x) => x.id !== material.id), material].sort((a, b) => a.position - b.position) }))
  },
  remove: async (id) => {
    if (supabase) {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw new Error(error.message)
    }
    set((s) => ({ materials: s.materials.filter((x) => x.id !== id) }))
  },
  replaceAll: async (materials) => {
    if (supabase) {
      const { error: deleteError } = await supabase.from(TABLE).delete().neq('id', '')
      if (deleteError) throw new Error(deleteError.message)
      if (materials.length) {
        const rows = materials.map((m, position) => ({ id: m.id, name: m.name, stock: m.stock, threshold: m.minStock ?? m.threshold, unit_cost: m.unitCost, position: m.position ?? position }))
        const { error } = await supabase.from(TABLE).insert(rows)
        if (error) throw new Error(error.message)
      }
    }
    set({ materials: materials.map((m, position) => ({ ...m, unitCost: m.unitCost ?? 0, position: m.position ?? position, minStock: m.minStock ?? m.threshold, threshold: m.minStock ?? m.threshold })) })
  },
}), {
  name: 'armurerie-stock',
  partialize: (s) => hasDb ? {} : { materials: s.materials },
  merge: (persisted, current) => {
    const saved = persisted as Partial<StockState>
    return { ...current, ...saved, available: !hasDb, materials: Array.isArray(saved.materials) ? saved.materials.map((m, position) => ({ ...m, unitCost: m.unitCost ?? 0, position: m.position ?? position, minStock: m.minStock ?? m.threshold, threshold: m.minStock ?? m.threshold })) : current.materials }
  },
}))

export function subscribeStock(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const ch = supabase
    .channel('armurerie-stock')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      clearTimeout(t)
      t = setTimeout(onChange, 250)
    })
    .subscribe()
  return () => {
    clearTimeout(t)
    supabase!.removeChannel(ch)
  }
}

export const isCritical = (m: Material) => m.stock <= (m.minStock ?? m.threshold)

/** Recette normalisée en ingredients même pour les anciennes sauvegardes. */
export function productIngredients(p: Product | undefined) {
  if (!p) return []
  return p.ingredients?.length ? p.ingredients : Object.entries(p.recipe ?? {}).map(([materialId, qty]) => ({ materialId, qty }))
}

/** Coût de fabrication : taxe fixe + quantité de chaque ingrédient × son coût unitaire. */
export function unitCost(p: Product | undefined, materials: Material[]) {
  if (!p) return 0
  return round2((p.craftTax ?? 0) + productIngredients(p).reduce((sum, ingredient) => {
    return sum + ingredient.qty * (materials.find((m) => m.id === ingredient.materialId)?.unitCost ?? 0)
  }, 0))
}

/** true si l'article a une fiche de fabrication connue (taxe ou recette). */
export const hasCostSheet = (p: Product | undefined) => !!p && ((p.craftTax ?? 0) > 0 || productIngredients(p).length > 0)

/** Quantités de matières consommées par une liste d'articles. */
export function consumption(items: OrderItem[], products: Product[]) {
  const need = new Map<string, number>()
  for (const i of items) {
    if (i.fabricated === false) continue
    const product = products.find((p) => p.id === i.productId)
    // Les munitions sont fabriquées via l'action dédiée de l'onglet Stock ; ne pas
    // les déduire une seconde fois à la vente puisqu'aucun stock d'échoppe n'est suivi.
    if (product?.category === 'Munitions' || i.category === 'Munitions') continue
    const ingredients = productIngredients(product)
    for (const { materialId, qty } of ingredients) need.set(materialId, (need.get(materialId) ?? 0) + qty * i.qty)
  }
  return need
}

/** Déduit du stock de matières les ingrédients d'une fabrication pour l'échoppe. */
export async function consumeMaterialsForCraft(product: Product, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Indiquez un nombre entier de munitions à fabriquer.')
  const ingredients = productIngredients(product)
  if (!ingredients.length) throw new Error(`Aucune recette de fabrication n'est définie pour « ${product.name} ».`)

  const st = useStock.getState()
  if (st.available === false) throw new Error('Le stock de matières est indisponible.')
  const required = new Map<string, number>()
  for (const { materialId, qty } of ingredients) {
    required.set(materialId, (required.get(materialId) ?? 0) + qty * quantity)
  }
  for (const [materialId, amount] of required) {
    const material = st.materials.find((m) => m.id === materialId)
    if (!material) throw new Error(`La matière « ${materialId} » est absente du stock.`)
    if (material.stock < amount) throw new Error(`Stock insuffisant en ${material.name} : ${material.stock} disponible(s), ${amount} requis.`)
  }
  await Promise.all([...required].map(([materialId, amount]) => st.adjust(materialId, -amount)))
  return required
}

/** Mouvement de stock pour une vente : sign −1 = consomme, +1 = restitue (annulation / suppression). */
export async function moveStockFor(items: OrderItem[], products: Product[], sign: 1 | -1) {
  const st = useStock.getState()
  if (!st.available) return
  const need = consumption(items, products)
  const before = new Map(st.materials.map((m) => [m.id, isCritical(m)]))
  await Promise.all([...need].map(([id, q]) => st.adjust(id, sign * q)))
  if (sign < 0) {
    // alerte seulement pour les matières qui viennent de passer sous le seuil
    const crossed = useStock.getState().materials.filter((m) => isCritical(m) && !before.get(m.id) && need.has(m.id))
    for (const m of crossed) toast.warning(`Stock critique : ${m.name} (${m.stock}) — pensez à commander.`, { duration: 8000 })
  }
}
