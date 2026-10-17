import type { Category, Product } from './types'

const p = (id: string, name: string, category: Category, price: number, image = true, craftTax = 0): Product => ({
  id,
  name,
  category,
  price,
  stock: null, // stock géré par matières (onglet Stock)
  craftTax,
  image: image ? `img/items/${id}.png` : undefined, // icônes du jeu (public/img/items)
})

// Grille de prix officielle des armureries (réunion, applicable le 3 octobre 1899 au soir).
const BASE: Product[] = [
  // Revolvers
  p('rev-cattleman', 'Revolver Cattleman', 'Revolvers', 74.5),
  p('rev-cattleman-mex', 'Cattleman mexicain', 'Revolvers', 69),
  p('rev-double', 'Revolver Double-Action', 'Revolvers', 51.5),
  p('rev-lemat', 'Revolver LeMat', 'Revolvers', 63),
  p('rev-navy', 'Revolver Navy', 'Revolvers', 16.5),
  p('rev-schofield', 'Revolver Schofield', 'Revolvers', 57.5),
  // Pistolets
  p('pis-mauser', 'Pistolet Mauser', 'Pistolets', 34.5),
  p('pis-semi', 'Pistolet semi-automatique', 'Pistolets', 63),
  p('pis-volcanic', 'Pistolet Volcanic', 'Pistolets', 69),
  p('pis-m1899', 'Pistolet M1899', 'Pistolets', 80.5),
  // Carabines
  p('car-repeat', 'Carabine à répétition', 'Carabines', 68.5),
  p('car-evans', 'Evans', 'Carabines', 86),
  p('car-henry', 'Henry', 'Carabines', 137.5),
  p('car-winchester', 'Winchester', 'Carabines', 120.5),
  // Fusils
  p('fus-varmint', 'Varmint', 'Fusils', 63),
  p('fus-bolt', 'Bolt (fusil à verrou)', 'Fusils', 189),
  p('fus-springfield', 'Springfield', 'Fusils', 218),
  p('fus-carcano', 'Carcano', 'Fusils', 558.5),
  p('fus-rolling', 'Rolling Block', 'Fusils', 520),
  p('pom-elephant', 'Fusil éléphant', 'Fusils', 322),
  // Fusils à pompe
  p('pom-pump', 'Fusil à pompe', 'Fusils à pompe', 323.5),
  p('pom-double', 'Double canon', 'Fusils à pompe', 378.5),
  p('pom-semi', 'Pompe semi-auto', 'Fusils à pompe', 290.5),
  p('pom-sawed', 'Canon scié', 'Fusils à pompe', 285),
  p('pom-repeating', 'Pompe à répétition', 'Fusils à pompe', 269.5),
  // Armes de jet & blanches
  p('bl-knife', 'Couteau', 'Armes de jet & blanches', 2.5),
  p('bl-rustic', 'Couteau de skinner', 'Armes de jet & blanches', 3),
  p('bl-cultist', 'Couteau cultiste', 'Armes de jet & blanches', 4),
  p('bl-throwing', 'Couteaux de lancer', 'Armes de jet & blanches', 12.5),
  p('bl-hatchet', 'Hachette', 'Armes de jet & blanches', 17.5),
  p('bl-machete', 'Machette', 'Armes de jet & blanches', 57),
  p('bl-machete-coll', 'Machette de collection', 'Armes de jet & blanches', 114.5),
  // Munitions (à l'unité) : armes à feu 0,30 · armes blanches 0,40
  p('mun-rev', 'Munitions de revolver normales', 'Munitions', 0.3),
  p('mun-pis', 'Munitions de pistolet normales', 'Munitions', 0.3),
  p('mun-car', 'Munitions de répétition normales', 'Munitions', 0.3),
  p('mun-varmint', 'Munitions de Varmint normales', 'Munitions', 0.3),
  p('mun-varmint-tranq', 'Munitions tranquillisantes de Varmint', 'Munitions', 0.3),
  p('mun-fus', 'Munitions de fusil normales', 'Munitions', 0.3),
  p('mun-elephant', 'Munitions de fusil à éléphant', 'Munitions', 0.3),
  p('mun-pom', 'Munitions de fusil à pompe normales', 'Munitions', 0.3),
  p('mun-knife', 'Munitions de couteaux de lancer', 'Munitions', 0.4),
  p('mun-hatchet', 'Munitions de hachette', 'Munitions', 0.4),
  // Accessoires (hors grille, prix inchangés)
  p('acc-oil', 'Huile pour arme', 'Accessoires', 0.2),
  p('acc-cuffs', 'Menottes', 'Accessoires', 1.25),
  p('acc-binoculars', 'Jumelles améliorées', 'Accessoires', 2),
  p('acc-lasso', 'Lasso renforcé', 'Accessoires', 5.5),
  // Personnalisation — esthétique (par modification : matériaux, gravures, teintes, poignée, emballage…)
  p('cus-esth-poing', 'Esthétique — arme de poing', 'Personnalisation', 1.5, false),
  p('cus-esth-epaule', "Esthétique — arme d'épaule", 'Personnalisation', 2, false),
  // Personnalisation — lunettes
  p('cus-lunette-petite', 'Lunette petite', 'Personnalisation', 110, false),
  p('cus-lunette-moyenne', 'Lunette moyenne', 'Personnalisation', 120, false),
  p('cus-lunette-grande', 'Lunette grande', 'Personnalisation', 140, false),
  // Personnalisation — améliorations mécaniques (canon, rayure, viseur…) selon le prix de l'arme
  p('cus-meca-1', 'Amélioration mécanique — arme 0 à 50 $', 'Personnalisation', 4.5, false, 4),
  p('cus-meca-2', 'Amélioration mécanique — arme 50 à 100 $', 'Personnalisation', 7, false, 4),
  p('cus-meca-3', 'Amélioration mécanique — arme 100 à 200 $', 'Personnalisation', 10, false, 4),
  p('cus-meca-4', 'Amélioration mécanique — arme 200 à 300 $', 'Personnalisation', 15, false, 4),
  p('cus-meca-5', 'Amélioration mécanique — arme 300 $ et plus', 'Personnalisation', 20, false, 4),
]

// Fiches de fabrication en jeu : frais admin / taxes + matières (voir onglet Stock)
const W = (tax: number, cuir: number, bois: number, fer: number) => ({ craftTax: tax, recipe: { ...(cuir ? { cuir } : {}), planches: bois, fer } })
const AMMO = { craftTax: 0, recipe: { plomb: 1, soufre: 1 } }
const SHEETS: Record<string, Pick<Product, 'craftTax' | 'recipe'>> = {
  'car-repeat': W(56.98, 1, 10, 10),
  'bl-knife': W(1.4, 0, 2, 2),
  'bl-rustic': W(1.9, 0, 2, 2),
  'bl-throwing': W(8.8, 0, 4, 4),
  'bl-hatchet': W(11.8, 0, 4, 4),
  'pom-sawed': W(253.98, 1, 20, 20),
  'pom-double': W(338.98, 1, 20, 20),
  'pom-elephant': W(293.98, 1, 20, 20),
  'pom-pump': W(288.98, 1, 20, 20),
  'pom-repeating': W(228.98, 1, 20, 20),
  'pom-semi': W(258.98, 1, 20, 20),
  'fus-bolt': W(160.48, 1, 15, 15),
  'fus-carcano': W(494.98, 1, 50, 50),
  'fus-rolling': W(460, 1, 50, 50),
  'fus-springfield': W(185.48, 1, 15, 15),
  'fus-varmint': W(53.48, 1, 5, 5),
  'bl-machete': W(47, 0, 10, 10),
  'bl-machete-coll': W(96.4, 0, 12, 12),
  'mun-knife': W(0, 0, 1, 1),
  'mun-hatchet': W(0, 0, 1, 1),
  'pis-m1899': W(68.5, 0, 5, 5),
  'pis-mauser': W(28.5, 0, 5, 5),
  'pis-semi': W(53.5, 0, 5, 5),
  'pis-volcanic': W(58.5, 0, 5, 5),
  'car-evans': W(71.98, 1, 10, 10),
  'car-henry': W(116.98, 1, 10, 10),
  'car-winchester': W(101.98, 1, 10, 10),
  'rev-cattleman': W(63.5, 0, 5, 5),
  'rev-cattleman-mex': W(58.5, 0, 5, 5),
  'rev-double': W(43.5, 0, 5, 5),
  'rev-lemat': W(53.5, 0, 5, 5),
  'rev-navy': W(13.5, 0, 5, 5),
  'rev-schofield': W(48.5, 0, 5, 5),
  'acc-oil': { craftTax: 0, recipe: { graisse: 1 } },
  'acc-binoculars': { craftTax: 0, recipe: { fer: 2 } },
  'acc-lasso': { craftTax: 0, recipe: { coton: 2 } },
  ...Object.fromEntries(['mun-rev', 'mun-pis', 'mun-car', 'mun-varmint', 'mun-varmint-tranq', 'mun-fus', 'mun-elephant', 'mun-pom'].map((id) => [id, AMMO])),
}

export const SEED_PRODUCTS: Product[] = BASE.map((p) => ({ ...p, ...SHEETS[p.id] }))

/** Tranche d'amélioration mécanique correspondant au prix d'une arme. */
export function mecaTrancheFor(price: number) {
  if (price < 50) return 'cus-meca-1'
  if (price < 100) return 'cus-meca-2'
  if (price < 200) return 'cus-meca-3'
  if (price < 300) return 'cus-meca-4'
  return 'cus-meca-5'
}
