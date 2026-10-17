export const CATEGORIES = [
  'Revolvers',
  'Pistolets',
  'Carabines',
  'Fusils',
  'Fusils à pompe',
  'Armes de jet & blanches',
  'Munitions',
  'Accessoires',
  'Personnalisation',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Ingredient {
  materialId: string
  qty: number
}

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  stock: number | null // null = illimité (services)
  image?: string // URL d'image optionnelle (sinon illustration auto)
  /** frais admin / taxes de fabrication ($) */
  craftTax?: number
  /** Ingrédients nécessaires à la fabrication. */
  ingredients?: Ingredient[]
  /** Ancien format conservé à la lecture des sauvegardes existantes. */
  recipe?: Record<string, number>
}

export interface Client {
  id: string
  name: string
  phone: string
  license: string // plus utilisé (n° de permis retiré de l'interface)
  licenseValid: boolean
  notes: string
  createdAt: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  qty: number
  /** coût de fabrication unitaire au moment de la vente (compta) */
  cost?: number
  /** Catégorie et choix de fabrication figés pour que l'historique reste stable. */
  category?: Category
  fabricated?: boolean
  /** Parts calculées au moment de la vente (shopShare avant taxe client). */
  netSale?: number
  shopShare?: number
  sellerShare?: number
  /** Snapshot par ligne requis pour audit/synchronisation Supabase. */
  caissePart?: number
  vendorPart?: number
  craftCost?: number
  vendorId?: string | null
  /** false when an item (notably shop ammo) is crafted separately before any sale. */
  materialsConsumed?: boolean
}

export type OrderStatus = 'en_attente' | 'payee' | 'livree' | 'annulee'

export interface Order {
  id: string
  number: number
  clientId: string | null
  clientName: string
  items: OrderItem[]
  discountPct: number
  taxPct: number
  subtotal: number
  discount: number
  tax: number
  total: number
  received: number
  change: number
  status: OrderStatus
  note: string
  createdAt: number
  /** partenaire appliqué à la vente et montant de sa remise (inclus dans discount) */
  partnerName?: string | null
  partnerDiscount?: number
  /** employé qui a fait la vente */
  seller?: string | null
  /** Parts et coût de fabrication figés au moment de la vente (taxe client incluse dans caissePart). */
  caissePart?: number
  vendorPart?: number
  craftCost?: number
  vendorId?: string | null
}

export interface Settings {
  shopName: string
  town: string
  taxPct: number
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  payee: 'Payée',
  livree: 'Livrée',
  annulee: 'Annulée',
}
