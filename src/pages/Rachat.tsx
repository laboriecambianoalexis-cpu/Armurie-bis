import { ArrowLeftRight, BadgeDollarSign, PackageOpen, Repeat, Search, Trash2, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Empty, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { BUY_RATE, buyPriceFor, SELL_RATE, sellPriceFor, useRachat, type Buyback } from '@/lib/rachat'
import { currentSellerName } from '@/lib/staff'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'
import { cn, fmtDate, isWeapon, money, normName, toNum, WEAPON_CATEGORIES } from '@/lib/utils'

const pct = (r: number) => `${Math.round(r * 100)} %`

const safe = async (f: () => Promise<unknown>, ok?: string) => {
  try {
    await f()
    if (ok) toast.success(ok)
    return true
  } catch (err) {
    toast.error(`Base de données : ${(err as Error).message}`)
    return false
  }
}

function WeaponIcon({ product, className }: { product?: Product; className?: string }) {
  return (
    <span className={cn('grid size-11 shrink-0 place-items-center rounded-lg border border-white/8 bg-black/30', className)}>
      {product?.image ? <img src={product.image} alt="" className="max-h-9 max-w-10 object-contain" loading="lazy" /> : <Repeat size={18} className="text-sepia" />}
    </span>
  )
}

/** Choix de l'arme : recherche + catégories + vignettes avec icône. */
function WeaponPicker({ weapons, onPick }: { weapons: Product[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('Toutes')
  const list = weapons.filter((w) => (cat === 'Toutes' || w.category === cat) && (!q || normName(w.name).includes(normName(q))))
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={15} />
        <input className="field py-1.5 pl-9" placeholder="Chercher une arme…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {['Toutes', ...WEAPON_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              'cursor-pointer rounded-full border px-2.5 py-0.5 text-[13px] transition',
              cat === c ? 'border-blood bg-blood text-white' : 'border-white/10 text-sepia hover:bg-white/[.06] hover:text-ink',
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="scroll-thin mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
        {list.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onPick(w.id)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1 text-left transition hover:border-white/15 hover:bg-white/[.05]"
            >
              <WeaponIcon product={w} className="size-9" />
              <span className="min-w-0 flex-1 truncate text-[15.5px]">{w.name}</span>
              <span className="text-right leading-tight">
                <span className="block font-type text-[17px] text-blood">{money(buyPriceFor(w.price))}</span>
                <span className="block text-[11.5px] text-sepia">neuf {money(w.price)}</span>
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-4 text-center text-sepia italic">Aucune arme trouvée.</li>}
      </ul>
    </div>
  )
}

/** Formulaire « Racheter une arme ». */
function BuyForm({ weapons }: { weapons: Product[] }) {
  const buy = useRachat((s) => s.buy)
  const clients = useStore((s) => s.clients)
  const [productId, setProductId] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [from, setFrom] = useState('')
  const [note, setNote] = useState('')
  const product = weapons.find((w) => w.id === productId)

  function pick(id: string) {
    setProductId(id)
    const p = weapons.find((w) => w.id === id)
    setBuyPrice(p ? String(buyPriceFor(p.price)) : '')
    setSellPrice(p ? String(sellPriceFor(p.price)) : '')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const seller = currentSellerName()
    if (!seller) return toast.error('Choisis d’abord qui rachète (« Vendeur » en haut de la page).')
    if (!product) return toast.error('Choisis l’arme rachetée.')
    if (!from.trim()) return toast.error('Indique à qui tu rachètes l’arme.')
    const b = toNum(buyPrice)
    const ok = await safe(
      () => buy({ productId: product.id, name: product.name, buyPrice: b, sellPrice: toNum(sellPrice), boughtFrom: from.trim(), boughtBy: seller, note: note.trim() }),
      `${product.name} rachetée ${money(b)} à ${from.trim()}.`,
    )
    if (ok) {
      pick('')
      setFrom('')
      setNote('')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <span className="mb-1.5 block font-sc text-[15px] tracking-[.14em] text-sepia">Arme rachetée *</span>
        {product ? (
          <div className="flex items-center gap-3 rounded-xl border border-blood/50 bg-black/25 p-3">
            <WeaponIcon product={product} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px]">{product.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13.5px] whitespace-nowrap">
                <span className="text-sepia">neuf {money(product.price)}</span>
                <span className="text-blood">rachat {money(buyPriceFor(product.price))}</span>
                <span className="text-brass">revente {money(sellPriceFor(product.price))}</span>
              </div>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => pick('')}>
              Changer
            </Button>
          </div>
        ) : (
          <WeaponPicker weapons={weapons} onPick={pick} />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Prix payé ($)" hint="Modifiable si l’arme est abîmée.">
          <input className="field" inputMode="decimal" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} disabled={!product} />
        </Field>
        <Field label="Prix de revente ($)">
          <input className="field" inputMode="decimal" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} disabled={!product} />
        </Field>
      </div>
      <Field label="Rachetée à *">
        <input className="field" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={80} placeholder="Nom & prénom" list="rachat-clients" />
      </Field>
      <Field label="Note (état, modifications…)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Gravure or, canon long…" />
      </Field>
      <datalist id="rachat-clients">
        {clients.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <Button type="submit" variant="blood" className="w-full" disabled={!product}>
        <ArrowLeftRight size={17} /> Racheter{product && ` pour ${money(toNum(buyPrice))}`}
      </Button>
    </form>
  )
}

/** Fenêtre « Revendre ». */
function SellForm({ item, onDone }: { item: Buyback; onDone: () => void }) {
  const sell = useRachat((s) => s.sell)
  const clients = useStore((s) => s.clients)
  const [to, setTo] = useState('')
  const [price, setPrice] = useState(String(item.sellPrice))
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const seller = currentSellerName()
    if (!seller) return toast.error('Choisis d’abord qui vend (« Vendeur » en haut de la page).')
    if (!to.trim()) return toast.error('Indique le nom de l’acheteur.')
    const p = toNum(price)
    if (await safe(() => sell(item.id, { soldTo: to.trim(), soldBy: seller, soldPrice: p }), `${item.name} revendue ${money(p)}.`)) onDone()
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Acheteur *">
        <input className="field" autoFocus value={to} onChange={(e) => setTo(e.target.value)} maxLength={80} placeholder="Nom & prénom" list="rachat-clients-vente" />
      </Field>
      <datalist id="rachat-clients-vente">
        {clients.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <Field label="Prix de vente ($)" hint={`Rachetée ${money(item.buyPrice)} · marge ${money(toNum(price) - item.buyPrice)}`}>
        <input className="field text-lg" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          Encaisser {money(toNum(price))}
        </Button>
      </div>
    </form>
  )
}

export default function Rachat() {
  const { available, items, unsell, remove } = useRachat()
  const products = useStore((s) => s.products)
  const weapons = useMemo(() => products.filter((p) => isWeapon(p.category)), [products])
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const [selling, setSelling] = useState<Buyback | null>(null)
  const [q, setQ] = useState('')
  const { ask, dialog } = useConfirm()

  const stock = items.filter((i) => !i.soldAt)
  const sold = items.filter((i) => i.soldAt).sort((a, b) => b.soldAt! - a.soldAt!)
  const stockCost = stock.reduce((s, i) => s + i.buyPrice, 0)
  const stockResale = stock.reduce((s, i) => s + i.sellPrice, 0)
  const margin = sold.reduce((s, i) => s + (i.soldPrice ?? 0) - i.buyPrice, 0)
  const grid = weapons.filter((w) => !q || normName(`${w.name} ${w.category}`).includes(normName(q)))

  if (available === false)
    return (
      <Panel title="Rachat" icon={<Repeat />}>
        <Empty icon={<Repeat size={34} />}>La table « rachat » n’est pas encore créée dans la base. Demande à l’administrateur de lancer la mise à jour Supabase.</Empty>
      </Panel>
    )

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Armes en stock', value: String(stock.length), sub: `payées ${money(stockCost)}` },
          { label: 'Valeur de revente', value: money(stockResale), sub: `marge attendue ${money(stockResale - stockCost)}` },
          { label: 'Marge réalisée', value: money(margin), sub: `${sold.length} arme(s) revendue(s)` },
        ].map((s) => (
          <div key={s.label} className="glass-panel px-5 py-4">
            <p className="label text-[14px] text-sepia">{s.label}</p>
            <p className="font-type text-4xl tracking-[.02em]">{s.value}</p>
            <p className="text-[14px] text-sepia-2 italic">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        <Panel title="Racheter" icon={<ArrowLeftRight />} className="self-start">
          <p className="-mt-2 mb-3 text-[14.5px] text-sepia italic">
            Rachat à {pct(BUY_RATE)} du prix neuf, revente à {pct(SELL_RATE)}.
          </p>
          <BuyForm weapons={weapons} />
        </Panel>

        <Panel title="Stock d’occasion" icon={<PackageOpen />}>
          {stock.length === 0 ? (
            <Empty icon={<PackageOpen size={32} />}>Aucune arme d’occasion en stock.</Empty>
          ) : (
            <ul className="divide-y divide-white/[.06]">
              {stock.map((i) => (
                <li key={i.id} className="group flex flex-wrap items-center gap-3 py-2.5">
                  <WeaponIcon product={i.productId ? byId.get(i.productId) : undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px]">{i.name}</p>
                    <p className="truncate text-[13.5px] text-sepia">
                      Rachetée à {i.boughtFrom} · {fmtDate(i.boughtAt)}
                      {i.boughtBy && ` · par ${i.boughtBy}`}
                      {i.note && <span className="text-sepia-2"> · {i.note}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-type text-2xl text-brass">{money(i.sellPrice)}</p>
                    <p className="text-[12.5px] text-sepia">
                      payée {money(i.buyPrice)} · +{money(i.sellPrice - i.buyPrice)}
                    </p>
                  </div>
                  <Button size="sm" variant="blood" onClick={() => setSelling(i)}>
                    <BadgeDollarSign size={15} /> Vendre
                  </Button>
                  <button
                    className="cursor-pointer rounded p-1 text-sepia-2 opacity-60 transition hover:text-blood group-hover:opacity-100"
                    onClick={async () => {
                      if (await ask(`Supprimer ${i.name} du stock d’occasion ? (le rachat disparaîtra aussi de la compta)`)) await safe(() => remove(i.id), 'Rachat supprimé.')
                    }}
                    aria-label={`Supprimer ${i.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {sold.length > 0 && (
            <details className="mt-5 border-t border-white/8 pt-3">
              <summary className="label cursor-pointer text-[15px] text-sepia hover:text-ink">Revendues ({sold.length})</summary>
              <ul className="mt-2 divide-y divide-white/[.06]">
                {sold.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-[15px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{i.name}</p>
                      <p className="truncate text-[13px] text-sepia">
                        {i.boughtFrom} → {i.soldTo} · {fmtDate(i.soldAt!)}
                        {i.soldBy && ` · par ${i.soldBy}`}
                      </p>
                    </div>
                    <span className="font-type text-lg">
                      {money(i.buyPrice)} → {money(i.soldPrice ?? 0)}
                    </span>
                    <span className={cn('w-20 text-right font-type text-lg', (i.soldPrice ?? 0) >= i.buyPrice ? 'text-sage' : 'text-blood')}>
                      {(i.soldPrice ?? 0) >= i.buyPrice ? '+' : '−'}
                      {money(Math.abs((i.soldPrice ?? 0) - i.buyPrice))}
                    </span>
                    <button
                      className="cursor-pointer rounded p-1 text-sepia-2 hover:text-ink"
                      title="Annuler la vente (remettre en stock)"
                      onClick={async () => {
                        if (await ask(`Annuler la vente de ${i.name} et la remettre en stock ?`)) await safe(() => unsell(i.id), 'Remise en stock.')
                      }}
                    >
                      <Undo2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panel>
      </div>

      <Panel
        title="Grille de rachat"
        icon={<BadgeDollarSign />}
        actions={
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={15} />
            <input className="field w-56 py-1.5 pl-9" placeholder="Chercher une arme…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[520px]">
            <thead>
              <tr>
                <th>Arme</th>
                <th className="text-right!">Prix neuf</th>
                <th className="text-right!">Rachat {pct(BUY_RATE)}</th>
                <th className="text-right!">Revente {pct(SELL_RATE)}</th>
                <th className="text-right!">Marge</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span className="text-[16.5px]">{w.name}</span> <span className="text-[13px] text-sepia">· {w.category}</span>
                  </td>
                  <td className="text-right font-type text-lg text-sepia">{money(w.price)}</td>
                  <td className="text-right font-type text-xl text-blood">{money(buyPriceFor(w.price))}</td>
                  <td className="text-right font-type text-xl text-brass">{money(sellPriceFor(w.price))}</td>
                  <td className="text-right font-type text-lg">+{money(sellPriceFor(w.price) - buyPriceFor(w.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={!!selling} onOpenChange={(v) => !v && setSelling(null)} title={selling ? `Vendre : ${selling.name}` : ''}>
        {selling && <SellForm item={selling} onDone={() => setSelling(null)} />}
      </Modal>
      {dialog}
    </div>
  )
}
