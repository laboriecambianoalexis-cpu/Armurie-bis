import { Plus, Sparkles } from 'lucide-react'
import { mecaTrancheFor } from '@/lib/seed'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'
import { cn, money } from '@/lib/utils'
import { ItemArt } from './ItemArt'

const HANDGUNS = ['Revolvers', 'Pistolets']
const LONG_GUNS = ['Carabines', 'Fusils', 'Fusils à pompe']

const GROUPS = [
  { prefix: 'cus-esth', title: 'Esthétique', hint: 'Prix par modification : matériaux, gravures, teintes, poignée, emballage…' },
  { prefix: 'cus-lunette', title: 'Lunettes', hint: '' },
  { prefix: 'cus-meca', title: 'Améliorations mécaniques', hint: "Canon, rayures, viseur… le prix dépend du prix de l'arme." },
]

/** Atelier de personnalisation : options vendues à part des armes, avec suggestion selon les armes de la note. */
export function CustomWorkshop({ options, inCart, onAdd }: { options: Product[]; inCart: (id: string) => number; onAdd: (id: string) => void }) {
  const { cart, products } = useStore()
  if (!options.length) return null

  // suggestions : pour chaque arme sur la note → esthétique poing/épaule + tranche mécanique
  const suggested = new Map<string, string[]>()
  const push = (id: string, who: string) => suggested.set(id, [...(suggested.get(id) ?? []), who])
  for (const i of cart.items) {
    const p = products.find((x) => x.id === i.productId)
    if (!p) continue
    if (HANDGUNS.includes(p.category)) push('cus-esth-poing', p.name)
    if (LONG_GUNS.includes(p.category)) push('cus-esth-epaule', p.name)
    if ([...HANDGUNS, ...LONG_GUNS].includes(p.category)) push(mecaTrancheFor(p.price), `${p.name} (${money(p.price)})`)
  }

  const known = GROUPS.map((g) => ({ ...g, items: options.filter((o) => o.id.startsWith(g.prefix)) }))
  const others = options.filter((o) => !GROUPS.some((g) => o.id.startsWith(g.prefix)))
  const groups = [...known, ...(others.length ? [{ prefix: '', title: 'Autres', hint: '', items: others }] : [])].filter((g) => g.items.length)

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.title}>
          <p className="ornament mb-1 text-[17px]">{g.title}</p>
          {g.hint && <p className="mb-2.5 text-[15px] text-sepia italic">{g.hint}</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
            {g.items.map((o) => {
              const n = inCart(o.id)
              const who = suggested.get(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => onAdd(o.id)}
                  className={cn(
                    'tile group flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left',
                    n > 0 && 'border-blood/60',
                    who && !n && 'border-brass/60 shadow-[0_0_24px_-8px_rgba(214,165,77,.6)]',
                  )}
                  aria-label={`Ajouter ${o.name} à la note`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[.05]">
                    <ItemArt product={o} className="size-10 [&_svg]:size-5" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-[16.5px]">{o.name}</span>
                    {who && (
                      <span className="mt-0.5 flex items-center gap-1 text-[13.5px] text-brass">
                        <Sparkles size={12} /> Pour {who.join(', ')}
                      </span>
                    )}
                  </span>
                  {n > 0 && <span className="rounded-md bg-blood px-1.5 font-type text-[14px] tracking-[.06em] text-white">×{n}</span>}
                  <span className="font-type text-[19px] whitespace-nowrap">{money(o.price)}</span>
                  <Plus size={16} className="shrink-0 text-sepia transition group-hover:text-blood" />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
