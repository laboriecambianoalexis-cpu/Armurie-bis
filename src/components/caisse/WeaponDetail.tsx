import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb, Minus, OctagonAlert, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { sheetFor, TAG_LABEL } from '@/lib/guide'
import type { Product } from '@/lib/types'
import { money } from '@/lib/utils'

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-3">
      <span className="label text-[15px] text-sepia">{label}</span>
      {value ? (
        <div className="statbar">
          <motion.i initial={{ width: 0 }} animate={{ width: `${value * 20}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
      ) : (
        <span className="text-sm text-sepia-2 italic">non précisé</span>
      )}
    </div>
  )
}

/** Fiche de l'arme sélectionnée : description de la formation + barres de stats façon armurier du jeu. */
export function WeaponDetail({ product, onAdd }: { product: Product | null; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1)
  const sheet = product ? sheetFor(product) : undefined
  const never = sheet?.tags.includes('jamais')

  return (
    <AnimatePresence mode="wait">
      {product && (
        <motion.section
          key={product.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="glass-panel mt-4 grid gap-6 p-5 md:grid-cols-[1fr_1.1fr]"
        >
          <div>
            <h3 className="font-western text-4xl leading-none tracking-[.05em]">{(sheet?.name ?? product.name).toUpperCase()}</h3>
            {sheet && sheet.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sheet.tags.map((t) => (
                  <span key={t} className={`label rounded-full border px-2 py-px text-[13px] ${t === 'jamais' ? 'border-blood bg-blood/20 text-blood' : 'border-white/12 text-sepia'}`}>
                    {TAG_LABEL[t]}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-[17px] leading-snug text-sepia">{sheet?.summary ?? product.category}</p>
            {sheet?.advice && (
              <p className="mt-3 flex gap-2 text-[16px] leading-snug text-ink">
                <Lightbulb size={17} className="mt-0.5 shrink-0 text-brass" />
                {sheet.advice}
              </p>
            )}
            {never && (
              <p className="label mt-3 flex items-center gap-2 text-blood">
                <OctagonAlert size={16} /> À ne jamais vendre
              </p>
            )}
          </div>

          <div className="flex flex-col justify-between gap-4">
            {sheet && (sheet.damage || sheet.rate || sheet.range) ? (
              <div className="space-y-2.5">
                <Stat label="Dégâts" value={sheet.damage} />
                <Stat label="Cadence" value={sheet.rate} />
                <Stat label="Portée" value={sheet.range} />
              </div>
            ) : (
              <p className="text-sepia-2 italic">Pas de statistiques dans les notes de formation.</p>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
              <span className="font-type text-4xl tracking-[.03em]">{money(product.price * qty)}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-white/12 bg-white/[.04]">
                  <button className="cursor-pointer p-2 text-sepia hover:text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Moins">
                    <Minus size={15} />
                  </button>
                  <span className="w-8 text-center font-type text-xl">{qty}</span>
                  <button className="cursor-pointer p-2 text-sepia hover:text-ink" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Plus">
                    <Plus size={15} />
                  </button>
                </div>
                <Button
                  variant="blood"
                  onClick={() => {
                    onAdd(qty)
                    setQty(1)
                  }}
                >
                  <Plus size={16} /> Ajouter
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
