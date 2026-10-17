import type { Order, OrderItem, Product } from './types'
import type { Material } from './stock'
import { hasCostSheet, unitCost } from './stock'
import { round2 } from './utils'

export interface SaleAllocation {
  items: OrderItem[]
  /** Somme revenant à la boutique, hors taxe client. */
  shopRevenue: number
  /** Somme revenant à la boutique, taxe client incluse. */
  shopShare: number
  sellerShare: number
  shopReceivable: number
  boutiqueNet: number
  /** Coûts supportés par la boutique (hors personnalisation). */
  shopCost: number
  /** Coût informatif total, personnalisation comprise. */
  manufacturingCost: number
}

const isCustomization = (category?: string) => category === 'Personnalisation'

/** Répartit la remise sur chaque ligne et calcule les parts boutique / vendeur. */
export function allocateSaleItems(items: OrderItem[], discount: number, products: Product[], materials: Material[], customerTax = 0): SaleAllocation {
  const grossTotal = round2(items.reduce((sum, item) => sum + item.price * item.qty, 0))
  let discountLeft = round2(Math.min(grossTotal, Math.max(0, discount)))
  let shopRevenue = 0
  let sellerShare = 0
  let shopCost = 0
  let manufacturingCost = 0

  const allocated = items.map((item, index) => {
    const product = products.find((p) => p.id === item.productId)
    const category = item.category ?? product?.category
    const customization = isCustomization(category)
    const fabricated = item.fabricated ?? (customization || hasCostSheet(product) || (item.cost ?? 0) > 0)
    const unitManufacturingCost = item.cost ?? unitCost(product, materials)
    const lineGross = round2(item.price * item.qty)
    const lineDiscount = index === items.length - 1
      ? discountLeft
      : grossTotal > 0 ? round2(Math.min(discountLeft, discount * lineGross / grossTotal)) : 0
    discountLeft = round2(discountLeft - lineDiscount)
    const netSale = round2(lineGross - lineDiscount)
    const cost = round2(unitManufacturingCost * item.qty)
    const appliesFabrication = fabricated || customization
    const allocatedCost = appliesFabrication ? cost : 0
    let lineShopShare = netSale
    let lineSellerShare = 0
    let lineShopCost = 0
    let lineManufacturingCost = 0

    if (customization) {
      // L'atelier est hors comptabilité boutique : le vendeur garde la marge complète.
      lineShopShare = 0
      lineSellerShare = round2(netSale - allocatedCost)
      lineManufacturingCost = allocatedCost
    } else if (fabricated) {
      const margin = round2(netSale - allocatedCost)
      lineSellerShare = round2(margin * 0.5)
      lineShopShare = round2(allocatedCost + margin - lineSellerShare)
      lineShopCost = allocatedCost
      lineManufacturingCost = allocatedCost
    }

    shopRevenue = round2(shopRevenue + lineShopShare)
    sellerShare = round2(sellerShare + lineSellerShare)
    shopCost = round2(shopCost + lineShopCost)
    manufacturingCost = round2(manufacturingCost + lineManufacturingCost)

    return {
      ...item,
      category,
      fabricated,
      vendorId: item.vendorId ?? null,
      cost: appliesFabrication ? unitManufacturingCost : 0,
      netSale,
      shopShare: lineShopShare,
      sellerShare: lineSellerShare,
      caissePart: round2(lineShopShare + (customerTax && grossTotal > 0 ? customerTax * lineGross / grossTotal : 0)),
      vendorPart: lineSellerShare,
      craftCost: appliesFabrication ? cost : 0,
    }
  })

  const shopReceivable = round2(shopRevenue + customerTax)
  const boutiqueNet = round2(shopRevenue - shopCost)
  return { items: allocated, shopRevenue, shopShare: shopReceivable, sellerShare, shopReceivable, boutiqueNet, shopCost, manufacturingCost }
}

/** Utilise les parts figées avec la vente, ou estime les anciennes ventes sans ces champs. */
export function orderAllocation(order: Order, products: Product[], materials: Material[]): SaleAllocation {
  const saved = order.items.every((item) => item.netSale !== undefined && item.shopShare !== undefined && item.sellerShare !== undefined) || order.caissePart !== undefined || order.vendorPart !== undefined || order.craftCost !== undefined
  if (!saved) {
    const legacyItems = order.items.map((item) => ({ ...item, category: item.category ?? products.find((p) => p.id === item.productId)?.category }))
    return allocateSaleItems(legacyItems, order.discount, products, materials, order.tax)
  }

  const shopRevenue = order.caissePart !== undefined
    ? round2(order.caissePart - order.tax)
    : round2(order.items.reduce((sum, item) => sum + (item.shopShare ?? 0), 0))
  const sellerShare = order.vendorPart !== undefined
    ? round2(order.vendorPart)
    : round2(order.items.reduce((sum, item) => sum + (item.sellerShare ?? 0), 0))
  const shopCost = order.items.some((item) => item.craftCost !== undefined)
    ? round2(order.items.reduce((sum, item) => {
        const category = item.category ?? products.find((p) => p.id === item.productId)?.category
        return sum + (item.fabricated && !isCustomization(category) ? item.craftCost ?? 0 : 0)
      }, 0))
    : round2(order.items.reduce((sum, item) => {
        const category = item.category ?? products.find((p) => p.id === item.productId)?.category
        const product = products.find((p) => p.id === item.productId)
        const baseCost = item.cost ?? unitCost(product, materials)
        return sum + (item.fabricated && !isCustomization(category) ? baseCost * item.qty : 0)
      }, 0))
  const manufacturingCost = order.craftCost !== undefined ? order.craftCost : order.items.some((item) => item.craftCost !== undefined)
    ? round2(order.items.reduce((sum, item) => sum + (item.craftCost ?? 0), 0))
    : round2(order.items.reduce((sum, item) => {
        const category = item.category ?? products.find((p) => p.id === item.productId)?.category
        const product = products.find((p) => p.id === item.productId)
        const baseCost = item.cost ?? unitCost(product, materials)
        return sum + (item.fabricated || isCustomization(category) ? baseCost * item.qty : 0)
      }, 0))
  const shopReceivable = order.caissePart !== undefined ? round2(order.caissePart) : round2(shopRevenue + order.tax)
  const boutiqueNet = round2(shopRevenue - shopCost)
  return { items: order.items, shopRevenue, shopShare: shopReceivable, sellerShare, shopReceivable, boutiqueNet, shopCost, manufacturingCost }
}
