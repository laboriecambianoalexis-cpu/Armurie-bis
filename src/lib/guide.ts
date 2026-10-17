import type { Product } from './types'

/**
 * Guide de l'armurier — notes de la formation, mises en fiches.
 * `raw` = la note originale, conservée mot pour mot.
 * Notes 1 → 5 (absentes quand la formation ne dit rien).
 */
export type Tag = 'holster' | 'combat' | 'chasse' | 'passionnes' | 'polyvalent' | 'jamais' | 'debutant' | 'duo' | 'bruyant' | 'non-ameliorable'

export const TAG_LABEL: Record<Tag, string> = {
  holster: 'Se range dans l’étui',
  combat: 'Combat',
  chasse: 'Chasse',
  passionnes: 'Pour passionnés',
  polyvalent: 'Polyvalente',
  jamais: 'Ne jamais vendre',
  debutant: 'Petit budget',
  duo: 'Intéressant en duo',
  bruyant: 'Très bruyante',
  'non-ameliorable': 'Non améliorable',
}

export interface WeaponSheet {
  id: string
  family: Family
  name: string
  /** ids catalogue + mots-clés du nom pour relier la fiche aux articles (y compris ajoutés plus tard) */
  productIds?: string[]
  keywords?: string[]
  damage?: number
  rate?: number
  range?: number
  tags: Tag[]
  summary: string
  /** ce qu'il faut dire / proposer au client */
  advice?: string
  /** articles à proposer avec (ids catalogue) */
  suggest?: string[]
  raw: string
}

export const FAMILIES = ['Revolvers', 'Pistolets', 'Carabines', 'Fusils', 'Fusils à pompe', 'Armes blanches'] as const
export type Family = (typeof FAMILIES)[number]

export const SHEETS: WeaponSheet[] = [
  // ——— Revolvers ———
  {
    id: 'navy',
    family: 'Revolvers',
    name: 'Revolver Navy',
    productIds: ['rev-navy'],
    keywords: ['navy'],
    tags: ['debutant'],
    summary: 'Le revolver le moins cher de la boutique (16,50 $).',
    advice: 'À conseiller avec un couteau et un lasso.',
    suggest: ['bl-knife', 'acc-lasso'],
    raw: 'neivi moins chere 16$50 a conseiller avec un couteau et laceau',
  },
  {
    id: 'lemat',
    family: 'Revolvers',
    name: 'Revolver LeMat',
    productIds: ['rev-lemat'],
    keywords: ['lemat'],
    damage: 2,
    tags: [],
    summary: '1 balle de chevrotine : se charge avec une munition de fusil à pompe, les autres munitions sont normales. Peu de dégâts et de performances.',
    advice: 'Penser à proposer des munitions de fusil à pompe en plus des munitions de revolver.',
    suggest: ['mun-pom', 'mun-rev'],
    raw: 'leMa 1 balle de chauveretirne charger balle de fusil a pompe les autres munitions sont normal pas bcp de degats et de perf',
  },
  {
    id: 'schofield',
    family: 'Revolvers',
    name: 'Revolver Schofield',
    productIds: ['rev-schofield'],
    keywords: ['schofield', 'scofield'],
    damage: 4,
    rate: 2,
    range: 3,
    tags: ['passionnes'],
    summary: 'Revolver de passionnés : cadence de tir lente mais très bons dégâts à moyenne portée. Particulier à utiliser.',
    suggest: ['mun-rev'],
    advice: 'À réserver aux clients qui connaissent les armes.',
    raw: 'Scofield revolver des passioner cadence de tire lente tres bon degats a moyen porter particulier a utiliser',
  },
  {
    id: 'doubleaction',
    family: 'Revolvers',
    name: 'Revolver Double-Action',
    productIds: ['rev-double'],
    keywords: ['double-action', 'double action', 'doubleaction'],
    damage: 1,
    rate: 5,
    tags: ['duo'],
    summary: 'Mauvais revolver : grande cadence de tir mais peu de dégâts. Commence à être intéressant en duo (une dans chaque main).',
    advice: 'Si le client le veut, en proposer deux.',
    raw: 'doubleacction revolver de merde grande cadance de tire mais pas bcp de degats en duo commence a etre interresant',
  },
  {
    id: 'cattleman-mexicain',
    family: 'Revolvers',
    name: 'Cattleman mexicain',
    productIds: ['rev-cattleman-mex'],
    keywords: ['mexicain', 'mexican'],
    tags: ['non-ameliorable'],
    summary: 'Sort avec des gravures qu’on ne peut pas modifier et des performances qui lui sont propres. Impossible à améliorer.',
    advice: 'Prévenir le client : aucune amélioration ni gravure possible.',
    raw: 'catelman mexicain sorti avec des gravure on ne peux pas les bougers sort déjà avec des perf propre a lui impossible a ameliorer',
  },
  {
    id: 'cattleman',
    family: 'Revolvers',
    name: 'Cattleman classique',
    productIds: ['rev-cattleman'],
    keywords: ['cattleman'],
    damage: 5,
    tags: ['combat'],
    summary: 'Très fort une fois amélioré (rallonger le canon et faire un design dessus). Le meilleur des revolvers, et même de toutes les armes de poing.',
    advice: 'Proposer l’amélioration : canon rallongé + design.',
    raw: 'catelman classic tres fort ameliorer ralonger le canon et faire un disign dessu meilleur des revolver meme de toute les arme de poing',
  },

  // ——— Pistolets ———
  {
    id: 'mauser',
    family: 'Pistolets',
    name: 'Pistolet Mauser',
    productIds: ['pis-mauser'],
    keywords: ['mauser'],
    damage: 1,
    tags: ['holster'],
    summary: 'Mauvaise arme : grand chargeur mais pas de dégâts.',
    raw: 'moser une merde total grand chargeur mais pas de degats',
  },
  {
    id: 'semiauto',
    family: 'Pistolets',
    name: 'Pistolet semi-automatique',
    productIds: ['pis-semi'],
    keywords: ['semi-automatique', 'semi auto pistol', 'pistolet semi'],
    damage: 2,
    rate: 4,
    tags: ['holster'],
    summary: 'Sympa : haute cadence de tir. Pas très fort en dégâts, mais la cadence rattrape le coup.',
    raw: 'semi auto sympa car haute cadence de tire pas tres fort en degats mais la cadence ratrappe le coup',
  },
  {
    id: 'volcanic',
    family: 'Pistolets',
    name: 'Pistolet Volcanic',
    productIds: ['pis-volcanic'],
    keywords: ['volcanic', 'volcanique'],
    damage: 4,
    rate: 2,
    tags: ['holster', 'passionnes'],
    summary: 'Tire de la poudre directement. Très belle personnalisation (il en existe même une spéciale). Très beaux dégâts, cadence de tir lente. Pour les passionnés, pas une arme de combat.',
    advice: 'Mettre en avant la personnalisation ; déconseiller pour le combat.',
    raw: 'volcanique tire de la poudre direct tres belle personalisation meme une special tres beau degats cadence de tire lente 2 balles pour les passioner pas une arme de combats',
  },
  {
    id: 'm1899',
    family: 'Pistolets',
    name: 'Pistolet M1899',
    productIds: ['pis-m1899'],
    keywords: ['m1899'],
    damage: 4,
    rate: 5,
    range: 4,
    tags: ['holster', 'combat'],
    summary: 'Très haute cadence, très bons dégâts et bonne portée. L’alternative idéale au Cattleman : le Cattleman est moins rapide (seule différence) mais fait plus de dégâts par balle.',
    advice: 'Hésitation avec le Cattleman ? M1899 = rapidité, Cattleman = dégâts par balle.',
    raw: 'M1899 tres haute cadence tres bon degats et bonne portée idéale contre le catelman catelman moins rapide c est la seul différence mais lui fera plus de degats sur une balle',
  },

  // ——— Carabines ———
  {
    id: 'carbine',
    family: 'Carabines',
    name: 'Carabine',
    keywords: ['carbine', 'carabine à répétition'],
    damage: 2,
    tags: ['chasse'],
    summary: 'Petite arme de chasse : petit gibier, voire moyen gibier.',
    suggest: ['mun-car'],
    raw: 'carabine petite arme de chasse petit gibier voir moyen gibier',
  },
  {
    id: 'repeater',
    family: 'Carabines',
    name: 'Répétition',
    productIds: ['car-repeat'],
    keywords: ['lancaster'],
    range: 1,
    tags: ['chasse'],
    summary: 'Pour le moyen gibier, ça commence à être dur. Mauvaise à distance.',
    suggest: ['mun-car'],
    raw: 'répétition pour le moyens gibier ca commence a etre dure et nul a distance',
  },
  {
    id: 'evans',
    family: 'Carabines',
    name: 'Evans',
    productIds: ['car-evans'],
    keywords: ['evans'],
    rate: 5,
    range: 1,
    tags: ['combat'],
    summary: 'Arme qui se tire à la hanche, cadence de tir phénoménale. Peu de portée néanmoins.',
    suggest: ['mun-car'],
    raw: 'hevans une arme mise a la hanche a une cadednce de tire phénoménale pas bcp de porté néenmois',
  },
  {
    id: 'henry',
    family: 'Carabines',
    name: 'Henry',
    productIds: ['car-henry'],
    keywords: ['henry'],
    damage: 4,
    rate: 1,
    range: 4,
    tags: ['chasse'],
    summary: 'Arme de chasse uniquement : cadence de tir très lente, bonne portée, bons dégâts.',
    suggest: ['mun-car'],
    raw: 'la henris arme de chasse uniquement cadence de tire tres lente bonne porté bon degats',
  },
  {
    id: 'winchester',
    family: 'Carabines',
    name: 'Winchester',
    productIds: ['car-winchester'],
    keywords: ['winchester'],
    damage: 4,
    rate: 4,
    range: 4,
    tags: ['polyvalent', 'combat', 'chasse'],
    summary: 'La carabine par excellence : très bons dégâts, très bonne cadence, bonne distance. Arme polyvalente.',
    advice: 'Le choix sûr pour un client qui hésite.',
    suggest: ['mun-car'],
    raw: 'la winshester carabine par excelence tres bon degats tres bonne cadence arme polyvalente bonne distance',
  },

  // ——— Fusils ———
  {
    id: 'varmint',
    family: 'Fusils',
    name: 'Varmint',
    productIds: ['fus-varmint'],
    keywords: ['varmint', 'varmit'],
    tags: ['jamais'],
    summary: 'Arme à ne jamais vendre : utilisée avec des balles tranquillisantes ou traçantes.',
    advice: 'NE PAS VENDRE.',
    raw: 'varmit larme que je vendrai jamais car utiliser avec des balle tranquilisante ou tracante',
  },
  {
    id: 'bolt',
    family: 'Fusils',
    name: 'Fusil à verrou (Bolt-action)',
    productIds: ['fus-bolt'],
    keywords: ['bolt', 'verrou', 'culasse'],
    damage: 4,
    rate: 5,
    range: 4,
    tags: ['polyvalent', 'combat', 'chasse'],
    summary: 'Le fusil par excellence : cadence très rapide, très bonne portée, très bons dégâts. Le plus polyvalent.',
    suggest: ['mun-fus'],
    raw: 'fusil a veron alias le bolt arme par excelence cadence tres rapide tres bonne portée tres degats les plus polyvalente',
  },
  {
    id: 'springfield',
    family: 'Fusils',
    name: 'Springfield',
    productIds: ['fus-springfield'],
    keywords: ['springfield'],
    rate: 1,
    tags: ['chasse', 'passionnes'],
    summary: 'Pour le chasseur passionné, uniquement pour la chasse : très, très lent mais très précis.',
    advice: 'À conseiller à ceux qui chassent beaucoup.',
    suggest: ['mun-fus'],
    raw: 'Springfield arme pour le chasseur passioné uniquement de chasse tres tres lent tres precis a conseiller pour ceux qui font bcp de chasse',
  },
  {
    id: 'carcano',
    family: 'Fusils',
    name: 'Carcano',
    productIds: ['fus-carcano'],
    keywords: ['carcano'],
    damage: 5,
    rate: 4,
    range: 5,
    tags: ['bruyant', 'combat'],
    summary: 'Le meilleur fusil : portée incroyable avec lunette, beaucoup de dégâts, un peu moins de cadence que le Bolt. Fait beaucoup de bruit.',
    advice: 'À vendre aux très bons tireurs. Proposer la lunette.',
    suggest: ['mun-fus'],
    raw: 'le carcano meilleur fusil par excelence le meilleur portée incroyable avec lunette c est fou bcp de degats un peu moins de cadence de tire comparer au bolt a vendre au tres bon tireur car fait bcp de bruit',
  },
  {
    id: 'rollingblock',
    family: 'Fusils',
    name: 'Rolling Block',
    productIds: ['fus-rolling'],
    keywords: ['rolling', 'rolingblock'],
    damage: 5,
    rate: 1,
    tags: ['chasse'],
    summary: 'Une des plus fortes forces d’impact : beaucoup de dégâts mais super lent. Fait pour la chasse au gros gibier.',
    advice: 'Attention : avec une lunette, on ne peut plus viser avec la mire.',
    suggest: ['mun-fus'],
    raw: 'le rolingblock un des fusil avec une force d impact la plus puissante bcp de degats mais super lent fait pour la chasse au gros jibier si on met une lunette on ne peux plus regarder dans la mire',
  },

  // ——— Fusils à pompe ———
  {
    id: 'pump',
    family: 'Fusils à pompe',
    name: 'Pompe manuelle',
    productIds: ['pom-pump'],
    keywords: ['fusil à pompe', 'pump'],
    damage: 5,
    rate: 4,
    tags: ['combat'],
    summary: 'Pas un pompe classique : le rechargement se fait manuellement. Très bonne cadence de tir à la hanche, dégâts très forts.',
    suggest: ['mun-pom'],
    raw: 'pompe manuelle ce n est pas un pompe clasique car le rechargement se fait manuellement tres bonne cadence de tire a la hanche degats tres fort',
  },
  {
    id: 'doublebarrel',
    family: 'Fusils à pompe',
    name: 'Double canon',
    productIds: ['pom-double'],
    keywords: ['double canon', 'canon double', 'doublebarrel'],
    tags: [],
    summary: 'Se casse pour recharger. Simple, basique.',
    suggest: ['mun-pom'],
    raw: 'double canon qui se casse simple basique',
  },
  {
    id: 'semiauto-shotgun',
    family: 'Fusils à pompe',
    name: 'Pompe semi-auto',
    productIds: ['pom-semi'],
    keywords: ['semi-auto', 'semiauto'],
    damage: 3,
    rate: 5,
    tags: ['combat'],
    summary: 'Se recharge en semi-automatique : meilleure cadence, mais moins de dégâts.',
    suggest: ['mun-pom'],
    raw: 'pompe semiauto se recharge semi auto meilleur cadence mais moins de degats',
  },
  {
    id: 'sawedoff',
    family: 'Fusils à pompe',
    name: 'Canon scié',
    productIds: ['pom-sawed'],
    keywords: ['canon scié', 'sawed'],
    range: 1,
    tags: ['holster', 'combat'],
    summary: 'Se met dans l’étui (holster). Très efficace à courte distance.',
    suggest: ['mun-pom'],
    raw: 'canon sié se met dans le holdster tres efficasse a courte distance',
  },
  {
    id: 'elephant',
    family: 'Fusils à pompe',
    name: 'Fusil éléphant',
    productIds: ['pom-elephant'],
    keywords: ['éléphant', 'elephant'],
    damage: 5,
    rate: 1,
    tags: ['chasse'],
    summary: 'Très, très grand et très, très puissant. Cadence de tir très lente. Fait pour la chasse.',
    suggest: ['mun-elephant'],
    raw: 'fusil elephant tres tres grand et tres tres puissant cadence de tire tres lente fait pour la chasse',
  },
  {
    id: 'repeating-shotgun',
    family: 'Fusils à pompe',
    name: 'Pompe à répétition',
    productIds: ['pom-repeating'],
    keywords: ['pompe à répétition', 'repeating'],
    damage: 2,
    rate: 3,
    range: 4,
    tags: ['passionnes'],
    summary: 'Plutôt pour les connaisseurs : cadence normale, dégâts faibles, mais bonne portée.',
    suggest: ['mun-pom'],
    raw: 'pompe a répétition plus pour les connaiseur degats suffisant cadence normal mais degats a chier mais bonne portée',
  },

  // ——— Armes blanches ———
  {
    id: 'throwing',
    family: 'Armes blanches',
    name: 'Couteaux de lancer',
    productIds: ['bl-throwing'],
    keywords: ['couteaux de lancer', 'couteau de lancer'],
    tags: [],
    summary: 'On peut récupérer le couteau après l’avoir lancé.',
    raw: 'couteau de lancer on peut recup le couteau',
  },
  {
    id: 'knife',
    family: 'Armes blanches',
    name: 'Couteaux',
    productIds: ['bl-knife', 'bl-rustic', 'bl-cultist'],
    keywords: ['couteau'],
    tags: ['chasse'],
    summary: 'On peut dépecer avec les couteaux.',
    advice: 'Indispensable pour un chasseur.',
    raw: 'on peux dépeucer avec les couteau',
  },
]

/** Savoir-faire général de la formation. */
export const KNOW_HOW: { title: string; text: string; raw: string }[] = [
  {
    title: 'Munitions de carabine',
    text: 'Les munitions de carabine sont les munitions « de répétition ».',
    raw: 'munition de carabine : munition de répétition',
  },
  {
    title: 'Améliorations possibles',
    text: 'Mire, rayures, lunette, canon.',
    raw: 'amélioration : mire raynure lunette canon',
  },
  {
    title: 'Combo de gravure',
    text: 'Mettre toutes les gravures et changer celle du barillet : ça change tout.',
    raw: 'combo de gravure : met toutes les gravure et changer celle du barillet ca changera tout',
  },
  {
    title: 'Personnalisation spéciale',
    text: 'Chaque arme est particulière : jouer avec toute l’arme (complète et cachée). Incroyable, mais on ne peut plus la changer ensuite.',
    raw: 'personalitation special : chaque arme est particuliere jouer avec tout l arme complete et cacher incroyable mais peux pas la changer',
  },
  {
    title: 'Pistolets & étui',
    text: 'Les pistolets peuvent se ranger dans l’étui (holster) : très utile car on peut les cacher.',
    raw: 'aucun pistolet ne peux rentrer dans un holdster tres utile car on peux le cacher',
  },
]

export const CONTACT = { label: 'Télégramme Chaman', code: 'ST7083', raw: 'telegrame chaman st7083' }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Fiche correspondant à un article du catalogue (par id, sinon par mot-clé du nom). */
export function sheetFor(p: Pick<Product, 'id' | 'name' | 'category'>): WeaponSheet | undefined {
  if (p.category === 'Munitions' || p.category === 'Accessoires' || p.category === 'Personnalisation') return undefined
  const byId = SHEETS.find((s) => s.productIds?.includes(p.id))
  if (byId) return byId
  const n = norm(p.name)
  // le mot-clé le plus long gagne (« cattleman mexicain » avant « cattleman »)
  let best: { s: WeaponSheet; len: number } | undefined
  for (const s of SHEETS)
    for (const k of s.keywords ?? []) if (n.includes(norm(k)) && (!best || k.length > best.len)) best = { s, len: k.length }
  return best?.s
}
