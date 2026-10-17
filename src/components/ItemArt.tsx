import { Box, Crosshair, Gem, Hand, Hammer, Package, Paintbrush, PenTool, Ruler, ScanSearch, Wrench, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Product } from '@/lib/types'

type Kind = 'revolver' | 'pistol' | 'rifle' | 'shotgun' | 'knife' | 'throwing' | 'hatchet' | 'bullet' | 'shell' | 'oil' | 'lasso' | 'binoculars' | 'box'

/** Devine quelle illustration utiliser à partir du nom / de la catégorie. */
function kindOf(p: Product): Kind {
  const n = p.name.toLowerCase()
  if (n.includes('huile')) return 'oil'
  if (n.includes('lasso')) return 'lasso'
  if (n.includes('jumelle')) return 'binoculars'
  if (p.category === 'Munitions') {
    if (n.includes('pompe') || n.includes('shotgun') || n.includes('chevrotine') || n.includes('cartouche')) return 'shell'
    if (n.includes('hatchet') || n.includes('hachette')) return 'hatchet'
    if (n.includes('couteau')) return 'throwing'
    return 'bullet'
  }
  if (n.includes('hachette') || n.includes('hatchet') || n.includes('tomahawk')) return 'hatchet'
  if (n.includes('lancer')) return 'throwing'
  if (p.category === 'Revolvers') return 'revolver'
  if (p.category === 'Pistolets') return 'pistol'
  if (p.category === 'Carabines' || p.category === 'Fusils') return 'rifle'
  if (p.category === 'Fusils à pompe') return 'shotgun'
  if (p.category === 'Armes de jet & blanches') return 'knife'
  return 'box'
}

const Defs = () => (
  <defs>
    <linearGradient id="ia-steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e4e4e4" />
      <stop offset=".45" stopColor="#8d8d8d" />
      <stop offset="1" stopColor="#3f3f3f" />
    </linearGradient>
    <linearGradient id="ia-dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7a7a7a" />
      <stop offset="1" stopColor="#1f1f1f" />
    </linearGradient>
    <linearGradient id="ia-wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#c47a3d" />
      <stop offset=".6" stopColor="#8a4a1f" />
      <stop offset="1" stopColor="#4d240c" />
    </linearGradient>
    <linearGradient id="ia-brass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8a6418" />
      <stop offset=".35" stopColor="#f6de86" />
      <stop offset=".7" stopColor="#c9982f" />
      <stop offset="1" stopColor="#6e4c0f" />
    </linearGradient>
    <linearGradient id="ia-lead" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#5e6a78" />
      <stop offset=".4" stopColor="#c9d2dc" />
      <stop offset="1" stopColor="#3b4450" />
    </linearGradient>
    <linearGradient id="ia-red" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#6b0c0c" />
      <stop offset=".4" stopColor="#d23a2f" />
      <stop offset="1" stopColor="#5a0909" />
    </linearGradient>
  </defs>
)

const ART: Record<Kind, { vb: string; body: ReactNode }> = {
  revolver: {
    vb: '0 0 120 70',
    body: (
      <>
        <rect x="52" y="16" width="62" height="7" rx="2" fill="url(#ia-steel)" />
        <rect x="52" y="23" width="40" height="4" fill="url(#ia-dark)" />
        <rect x="34" y="12" width="22" height="18" rx="4" fill="url(#ia-steel)" />
        <path d="M36 14h18M36 20h18M36 26h18" stroke="#555" strokeWidth=".8" />
        <path d="M24 12l12 0 0 18-6 2z" fill="url(#ia-steel)" />
        <path d="M22 10l6-6 4 2-4 7z" fill="url(#ia-dark)" />
        <path d="M24 28l14 2-8 34-14-4z" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
        <path d="M38 30c0 8 10 9 12 0" fill="none" stroke="url(#ia-steel)" strokeWidth="2.2" />
      </>
    ),
  },
  pistol: {
    vb: '0 0 120 70',
    body: (
      <>
        <rect x="22" y="12" width="84" height="15" rx="2" fill="url(#ia-steel)" />
        <path d="M30 17h60M30 21h60" stroke="#666" strokeWidth=".7" />
        <rect x="100" y="16" width="10" height="6" fill="url(#ia-dark)" />
        <path d="M28 26h22l-6 36H26z" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
        <path d="M50 27c0 9 12 9 13 0" fill="none" stroke="url(#ia-steel)" strokeWidth="2.2" />
      </>
    ),
  },
  rifle: {
    vb: '0 0 170 60',
    body: (
      <g transform="rotate(-14 85 30)">
        <path d="M2 30l44-9 4 12L6 43z" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
        <rect x="46" y="21" width="30" height="11" rx="1.5" fill="url(#ia-steel)" />
        <path d="M58 32c0 7 10 7 10 0" fill="none" stroke="url(#ia-steel)" strokeWidth="2" />
        <rect x="74" y="23" width="92" height="4" fill="url(#ia-dark)" />
        <rect x="76" y="27" width="62" height="5" rx="1.5" fill="url(#ia-wood)" />
        <rect x="56" y="16" width="4" height="6" fill="url(#ia-dark)" />
      </g>
    ),
  },
  shotgun: {
    vb: '0 0 170 60',
    body: (
      <g transform="rotate(-14 85 30)">
        <path d="M2 31l44-10 4 13L6 45z" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
        <rect x="46" y="21" width="28" height="12" rx="2" fill="url(#ia-steel)" />
        <path d="M56 33c0 7 10 7 10 0" fill="none" stroke="url(#ia-steel)" strokeWidth="2" />
        <rect x="72" y="21" width="92" height="5" fill="url(#ia-dark)" />
        <rect x="72" y="26" width="92" height="4" fill="url(#ia-steel)" />
        <rect x="92" y="29" width="34" height="7" rx="2" fill="url(#ia-wood)" />
      </g>
    ),
  },
  knife: {
    vb: '0 0 120 70',
    body: (
      <g transform="rotate(-30 60 35)">
        <path d="M44 30h60l10 5-10 5H44z" fill="url(#ia-steel)" stroke="#444" strokeWidth=".6" />
        <path d="M46 35h58" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
        <rect x="38" y="26" width="6" height="18" rx="1" fill="url(#ia-brass)" />
        <rect x="8" y="30" width="30" height="10" rx="4" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
      </g>
    ),
  },
  throwing: {
    vb: '0 0 120 70',
    body: (
      <>
        {[-35, -20].map((a, i) => (
          <g key={a} transform={`rotate(${a} 60 35) translate(${i * 6} ${i * 8})`}>
            <path d="M40 31h52l12 4-12 4H40z" fill="url(#ia-steel)" stroke="#444" strokeWidth=".6" />
            <rect x="14" y="31" width="26" height="8" rx="2" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".6" />
            <path d="M18 31v8M24 31v8M30 31v8" stroke="#e4c48a" strokeWidth="1" />
          </g>
        ))}
      </>
    ),
  },
  hatchet: {
    vb: '0 0 120 80',
    body: (
      <g transform="rotate(35 60 40)">
        <rect x="56" y="10" width="7" height="68" rx="3" fill="url(#ia-wood)" stroke="#2b1204" strokeWidth=".8" />
        <path d="M52 8h16v14H52z" fill="url(#ia-dark)" />
        <path d="M66 6l26-4c4 10 4 20 0 30l-26-6z" fill="url(#ia-steel)" stroke="#333" strokeWidth=".7" />
      </g>
    ),
  },
  bullet: {
    vb: '0 0 120 100',
    body: (
      <>
        <path d="M48 34c0-18 6-28 12-30 6 2 12 12 12 30z" fill="url(#ia-lead)" />
        <rect x="46" y="34" width="28" height="56" rx="2" fill="url(#ia-brass)" />
        <rect x="44" y="88" width="32" height="6" rx="1.5" fill="url(#ia-brass)" />
        <path d="M46 40h28" stroke="#7a5510" strokeWidth="1" />
      </>
    ),
  },
  shell: {
    vb: '0 0 120 100',
    body: (
      <>
        <rect x="44" y="6" width="32" height="64" rx="3" fill="url(#ia-red)" />
        <path d="M48 12v52M56 12v52" stroke="#fff" strokeOpacity=".12" strokeWidth="2" />
        <rect x="42" y="68" width="36" height="22" rx="1.5" fill="url(#ia-brass)" />
        <rect x="40" y="88" width="40" height="6" rx="1.5" fill="url(#ia-brass)" />
      </>
    ),
  },
  oil: {
    vb: '0 0 120 100',
    body: (
      <>
        <path d="M58 22l6-14h4l-4 14z" fill="url(#ia-brass)" />
        <path d="M38 30c0-6 44-6 44 0z" fill="url(#ia-brass)" />
        <rect x="36" y="28" width="48" height="64" rx="4" fill="url(#ia-brass)" stroke="#5a3d0a" strokeWidth=".8" />
        <rect x="42" y="44" width="36" height="34" rx="2" fill="#efe1b8" stroke="#6b4a18" strokeWidth=".8" />
        <text x="60" y="58" textAnchor="middle" fontSize="8" fontFamily="Rye, serif" fill="#3a2410">GUN</text>
        <text x="60" y="70" textAnchor="middle" fontSize="8" fontFamily="Rye, serif" fill="#3a2410">OIL</text>
      </>
    ),
  },
  lasso: {
    vb: '0 0 120 90',
    body: (
      <g fill="none" stroke="#c9a66b" strokeWidth="3.2">
        {[0, 4, 8, 12].map((d) => (
          <ellipse key={d} cx={60 + d / 3} cy={46 - d / 4} rx={42 - d} ry={22 - d / 2} strokeOpacity={1 - d / 40} />
        ))}
        <path d="M24 56c-6 10-4 20 4 26" />
        <path d="M22 50c-2 2-1 6 2 7" stroke="#8a6a3a" />
      </g>
    ),
  },
  binoculars: {
    vb: '0 0 120 80',
    body: (
      <>
        {[28, 70].map((x) => (
          <g key={x}>
            <rect x={x} y="18" width="24" height="52" rx="5" fill="url(#ia-dark)" />
            <rect x={x - 2} y="12" width="28" height="12" rx="3" fill="url(#ia-steel)" />
            <rect x={x - 2} y="62" width="28" height="10" rx="3" fill="url(#ia-steel)" />
          </g>
        ))}
        <rect x="52" y="30" width="18" height="10" fill="url(#ia-steel)" />
        <circle cx="61" cy="26" r="5" fill="url(#ia-dark)" />
      </>
    ),
  },
  box: {
    vb: '0 0 120 80',
    body: (
      <>
        <rect x="26" y="20" width="68" height="48" rx="3" fill="url(#ia-wood)" stroke="#2b1204" />
        <path d="M26 36h68M26 52h68" stroke="#2b1204" strokeWidth="1" />
      </>
    ),
  },
}

/** Icône d'une option de personnalisation (pas d'image dans le jeu). */
function customIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('lunette')) return ScanSearch
  if (n.includes('esthétique')) return Paintbrush
  if (n.includes('amélioration')) return Wrench
  if (n.includes('gravure')) return PenTool
  if (n.includes('teinte')) return Paintbrush
  if (n.includes('matériau')) return Gem
  if (n.includes('viseur')) return Crosshair
  if (n.includes('emballage')) return Package
  if (n.includes('poignée')) return Hand
  if (n.includes('canon') || n.includes('rayure')) return Ruler
  if (n.includes('chargeur')) return Box
  if (n.includes('cadre')) return Hammer
  return Wrench
}

export function ItemArt({ product, className }: { product: Product; className?: string }) {
  if (!product.image && product.category === 'Personnalisation') {
    const Icon = customIcon(product.name)
    return (
      <span className={className} style={{ display: 'grid', placeItems: 'center' }}>
        <Icon size={46} strokeWidth={1.5} color="#e0b35c" />
      </span>
    )
  }
  if (product.image)
    return <img src={product.image} alt="" className={className} style={{ objectFit: 'contain' }} draggable={false} />
  const art = ART[kindOf(product)]
  return (
    <svg viewBox={art.vb} className={className} aria-hidden="true">
      <Defs />
      {art.body}
    </svg>
  )
}
