import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { ItemArt } from '@/components/ItemArt'
import type { Product } from '@/lib/types'
import { cn, money } from '@/lib/utils'

/** Tuile d'arme façon menu RDR2 : clic = voir la fiche, « + » = ajouter directement à la note. */
export function WeaponTile({
  product: p,
  inCart,
  selected,
  onSelect,
  onAdd,
}: {
  product: Product
  inCart: number
  selected: boolean
  onSelect: () => void
  onAdd: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === ' ' && (e.preventDefault(), onSelect())}
      className={cn('tile group cursor-pointer p-3.5 outline-none focus-visible:ring-2 focus-visible:ring-blood/70', selected && 'is-selected')}
      aria-label={`${p.name}, ${money(p.price)}`}
    >
      <div className="tile-glow" />
      {inCart > 0 && (
        <motion.span
          key={inCart}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3 z-10 rounded-md bg-blood px-2 font-type text-[15px] tracking-[.08em] text-white shadow-[0_0_14px_rgba(208,27,37,.6)]"
        >
          ×{inCart}
        </motion.span>
      )}
      <span className="absolute top-2.5 right-3.5 z-10 font-type text-[22px] tracking-[.04em] text-ink">{money(p.price)}</span>

      <div className="relative mt-8 mb-3 flex h-[88px] items-center justify-center">
        <ItemArt
          product={p}
          className="h-[88px] max-w-full drop-shadow-[0_12px_14px_rgba(0,0,0,.7)] transition-transform duration-300 group-hover:scale-[1.06]"
        />
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="min-w-0 text-[16.5px] leading-tight font-semibold text-ink">{p.name}</p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/[.06] text-ink transition hover:scale-110 hover:border-blood hover:bg-blood hover:shadow-[0_0_18px_rgba(208,27,37,.7)]"
          aria-label={`Ajouter ${p.name} à la note`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
