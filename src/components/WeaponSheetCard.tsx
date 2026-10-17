import { Lightbulb, OctagonAlert, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { TAG_LABEL, type Tag, type WeaponSheet } from '@/lib/guide'
import { useStore } from '@/lib/store'
import { cn, money } from '@/lib/utils'

const TAG_STYLE: Partial<Record<Tag, string>> = {
  jamais: 'border-blood bg-blood/20 text-blood',
  combat: 'border-blood/50 text-[#ff6b6b]',
  chasse: 'border-sage/50 text-sage',
  polyvalent: 'border-brass/50 text-brass',
  holster: 'border-[#7fb2e5]/50 text-[#7fb2e5]',
}

/** Jauge 1→5 façon « balles » (vide = non renseigné dans la formation). */
function Gauge({ label, value }: { label: string; value?: number }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-3">
      <span className="label text-[14px] text-sepia">{label}</span>
      {value ? (
        <div className="statbar" aria-label={`${value} sur 5`}>
          <i style={{ width: `${value * 20}%` }} />
        </div>
      ) : (
        <span className="text-xs italic text-sepia-2">non précisé</span>
      )}
    </div>
  )
}

export function WeaponSheetCard({ sheet, compact }: { sheet: WeaponSheet; compact?: boolean }) {
  const [showRaw, setShowRaw] = useState(false)
  const products = useStore((s) => s.products)
  const linked = products.filter((p) => sheet.productIds?.includes(p.id))
  const suggested = products.filter((p) => sheet.suggest?.includes(p.id))
  const never = sheet.tags.includes('jamais')

  return (
    <article className={cn('relative text-ink', !compact && 'tile p-4 hover:translate-y-0', never && !compact && 'border-blood/60')}>
      {!compact && (
        <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-western text-[26px] leading-none tracking-[.05em]">{sheet.name.toUpperCase()}</h3>
          {linked.map((p) => (
            <span key={p.id} className="font-type text-xl text-ink">
              {money(p.price)}
            </span>
          ))}
        </header>
      )}

      {sheet.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {sheet.tags.map((t) => (
            <span key={t} className={cn('label rounded-full border border-white/12 px-2 py-px text-[12.5px] text-sepia', TAG_STYLE[t])}>
              {TAG_LABEL[t]}
            </span>
          ))}
        </div>
      )}

      {never && (
        <p className="label mb-2 flex items-center gap-2 rounded-lg bg-blood/15 px-2 py-1 text-[14px] text-blood">
          <OctagonAlert size={16} /> Arme à ne jamais vendre
        </p>
      )}

      {(sheet.damage || sheet.rate || sheet.range) && (
        <div className="mb-3 space-y-2">
          <Gauge label="Dégâts" value={sheet.damage} />
          <Gauge label="Cadence" value={sheet.rate} />
          <Gauge label="Portée" value={sheet.range} />
        </div>
      )}

      <p className="leading-snug text-parch-2">{sheet.summary}</p>

      {sheet.advice && (
        <p className="mt-2 flex gap-2 rounded-xl border border-brass/25 bg-brass/[.08] px-2.5 py-1.5 text-[15.5px]">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-brass" />
          <span>
            <span className="font-semibold">Conseil : </span>
            {sheet.advice}
          </span>
        </p>
      )}

      {suggested.length > 0 && (
        <p className="mt-2 text-sm text-sepia">
          <span className="font-semibold">À proposer avec : </span>
          {suggested.map((p) => p.name).join(', ')}
        </p>
      )}

      <button onClick={() => setShowRaw((v) => !v)} className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-sepia-2 hover:text-ink">
        <ScrollText size={12} /> {showRaw ? 'Masquer' : 'Voir'} la note de formation
      </button>
      {showRaw && <p className="mt-1 border-l-2 border-white/15 pl-2 text-[14px] text-sepia italic">« {sheet.raw} »</p>}
    </article>
  )
}
