import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb, Minus, OctagonAlert, Plus, UserPlus, X, Store, Wallet } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { FxBoundary } from '@/components/fx/FxBoundary'
import { Button, Empty, Field } from '@/components/ui'
import type { WeaponSheet } from '@/lib/guide'
import { useFullFx, useWindowActive } from '@/lib/perf'
import { StaticEmblem } from '@/components/fx/StaticEmblem'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'
import { cartTotals, useExtras } from '@/lib/extras'
import { useStaff } from '@/lib/staff'
import { clamp, cn, money, orderNo, round2, toNum } from '@/lib/utils'
import { allocateSaleItems } from '@/lib/accounting'
import { useStock } from '@/lib/stock'

const RevolverCylinder3D = lazy(() => import('@/components/fx/RevolverCylinder3D'))

/** La note en cours : client, articles, conseils, total et encaissement. */
export function CartPanel({
  received,
  setReceived,
  busy,
  cartSheets,
  forbidden,
  suggestions,
  onAdd,
  onSheet,
  onNewClient,
  onFinish,
}: {
  received: string
  setReceived: (v: string) => void
  busy: boolean
  cartSheets: WeaponSheet[]
  forbidden: WeaponSheet[]
  suggestions: Product[]
  onAdd: (id: string) => void
  onSheet: (s: WeaponSheet) => void
  onNewClient: () => void
  onFinish: (status: 'payee' | 'en_attente') => void
}) {
  const { clients, cart, settings, nextOrderNumber, setQty, setFabricated, removeFromCart, setCart, clearCart } = useStore()
  const [extra, setExtra] = useState(false)
  const { partners } = useExtras()
  const products = useStore((s) => s.products)
  const totals = cartTotals(cart, products, settings, partners)
  const materials = useStock((s) => s.materials)
  const currentSeller = useStaff((s) => s.staff.find((staff) => staff.id === s.currentId)?.name)
  const allocation = allocateSaleItems(cart.items, totals.discount, products, materials, totals.tax)
  const receivedNum = toNum(received)
  const change = round2(receivedNum - totals.total)
  const client = clients.find((c) => c.id === cart.clientId)
  const quickCash = [5, 10, 20, 50, 100, 500].filter((v) => v >= totals.total * 0.2).slice(0, 4)
  const empty = cart.items.length === 0
  const fullFx = useFullFx()
  const active = useWindowActive()

  return (
    <section className="glass-panel flex flex-col p-5 lg:sticky lg:top-24">
      <header className="flex items-baseline justify-between border-b border-white/8 pb-3">
        <h2 className="font-western text-[32px] leading-none tracking-[.1em]">NOTE {orderNo(nextOrderNumber)}</h2>
        {!empty && <span className="label text-[14px] text-sepia">{cart.items.reduce((n, i) => n + i.qty, 0)} article(s)</span>}
      </header>

      <div className="mt-3 flex gap-2">
        <select className="field" value={cart.clientId ?? ''} onChange={(e) => setCart({ clientId: e.target.value || null })} aria-label="Client">
          <option value="">Client de passage</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.licenseValid ? '' : ' (sans permis)'}
            </option>
          ))}
        </select>
        <Button variant="ink" onClick={onNewClient} title="Nouveau client" aria-label="Nouveau client">
          <UserPlus size={18} />
        </Button>
      </div>
      {client && !client.licenseValid && <p className="mt-1.5 text-sm text-blood">Pas de permis de port d'arme valide.</p>}
      {partners.length > 0 && (
        <select
          className={cn('field mt-2', cart.partnerId && 'border-brass/60 text-brass')}
          value={cart.partnerId ?? ''}
          onChange={(e) => setCart({ partnerId: e.target.value || null })}
          aria-label="Partenaire"
        >
          <option value="">Aucun partenaire</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              Partenaire : {p.name} (−{p.customPct} % custom, −{p.weaponsPct} % armes)
            </option>
          ))}
        </select>
      )}

      {empty ? (
        <Empty
          vivid
          icon={
            fullFx ? (
              <FxBoundary fallback={<StaticEmblem size={64} />}>
                <Suspense fallback={<StaticEmblem size={64} />}>
                  <RevolverCylinder3D size={92} paused={!active} />
                </Suspense>
              </FxBoundary>
            ) : (
              <StaticEmblem size={64} />
            )
          }
        >
          La note est vide. Choisissez une arme.
        </Empty>
      ) : (
        <ul className="mt-3 max-h-[34vh] overflow-y-auto pr-1 scroll-thin">
          <AnimatePresence initial={false}>
            {cart.items.map((i) => (
              <motion.li
                key={i.productId}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                className="group flex items-center gap-2 border-b border-white/[.06] py-2"
              >
                <div className="flex items-center rounded-lg border border-white/10 bg-white/[.03] opacity-80 transition group-hover:opacity-100">
                  <button className="cursor-pointer p-1 text-sepia hover:text-ink" onClick={() => setQty(i.productId, i.qty - 1)} aria-label="Moins">
                    <Minus size={13} />
                  </button>
                  <span className="w-7 text-center font-type text-[17px]">{i.qty}</span>
                  <button className="cursor-pointer p-1 text-sepia hover:text-ink" onClick={() => onAdd(i.productId)} aria-label="Plus">
                    <Plus size={13} />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[17px]">{i.name}</span>
                  {(i.category ?? products.find((p) => p.id === i.productId)?.category) !== 'Personnalisation' && (
                    <label className="flex cursor-pointer items-center gap-1 text-[12px] text-sepia">
                      <input type="checkbox" checked={i.fabricated ?? false} onChange={(e) => setFabricated(i.productId, e.target.checked)} /> Fabriquée
                    </label>
                  )}
                  {(i.category ?? products.find((p) => p.id === i.productId)?.category) === 'Personnalisation' && <span className="block text-[12px] text-brass">100 % vendeur</span>}
                </div>
                <span className="font-type text-[19px] tracking-[.03em]">{money(i.price * i.qty)}</span>
                <button className="cursor-pointer rounded p-1 text-sepia-2 opacity-60 transition hover:text-blood group-hover:opacity-100" onClick={() => removeFromCart(i.productId)} aria-label="Retirer">
                  <X size={14} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Conseils de l'armurier */}
      {(cartSheets.some((x) => x.advice) || suggestions.length > 0 || forbidden.length > 0) && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-brass/25 bg-brass/[.07] p-3">
          <p className="label flex items-center gap-2 text-[14px] text-brass">
            <Lightbulb size={15} /> Conseil de l'armurier
          </p>
          {forbidden.map((f) => (
            <p key={f.id} className="label flex items-center gap-2 text-[14px] text-blood">
              <OctagonAlert size={15} /> {f.name} : à ne jamais vendre
            </p>
          ))}
          {cartSheets
            .filter((x) => x.advice && !x.tags.includes('jamais'))
            .map((x) => (
              <button key={x.id} onClick={() => onSheet(x)} className="block cursor-pointer text-left text-[15.5px] leading-snug text-parch-2 hover:text-ink">
                <b className="font-semibold text-ink">{x.name} :</b> {x.advice}
              </button>
            ))}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAdd(p.id)}
                  className="flex cursor-pointer items-center gap-1 rounded-full border border-white/12 bg-white/[.04] px-2.5 py-0.5 text-[14.5px] transition hover:border-brass hover:bg-brass/15"
                >
                  <Plus size={12} /> {p.name} <span className="font-type text-brass">{money(p.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remise / note (repliables) */}
      <button onClick={() => setExtra((v) => !v)} className="label mt-3 cursor-pointer self-start text-[14px] text-sepia hover:text-ink">
        {extra ? '− Masquer remise & note' : '+ Remise / note'}
      </button>
      {extra && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Remise (%)">
            <input className="field" inputMode="decimal" value={cart.discountPct || ''} placeholder="0" onChange={(e) => setCart({ discountPct: clamp(toNum(e.target.value), 0, 100) })} />
          </Field>
          <Field label="Note">
            <input className="field" value={cart.note} placeholder="Gravure, délai…" onChange={(e) => setCart({ note: e.target.value })} />
          </Field>
        </div>
      )}

      {/* Total */}
      <div className="mt-4 space-y-0.5 text-[15px] text-sepia">
        {(totals.discount > 0 || totals.tax > 0) && <Row label="Sous-total" value={money(totals.subtotal)} />}
        {totals.partner && totals.partnerDiscount > 0 && <Row label={`Partenaire ${totals.partner.name}`} value={`− ${money(totals.partnerDiscount)}`} />}
        {totals.discount - totals.partnerDiscount > 0.004 && <Row label={`Remise ${cart.discountPct}%`} value={`− ${money(totals.discount - totals.partnerDiscount)}`} />}
        {totals.tax > 0 && <Row label={`Taxe ${settings.taxPct}%`} value={`+ ${money(totals.tax)}`} />}
      </div>
      <div className="mt-1 flex items-end justify-between">
        <span className="label pb-2 text-[20px] text-sepia">Total</span>
        <motion.span key={totals.total} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-type text-[68px] leading-none tracking-[.01em] [text-shadow:0_0_30px_rgba(255,255,255,.15)]">
          {money(totals.total)}
        </motion.span>
      </div>

      {/* Répartition de la vente avant confirmation */}
      {!empty && (
        <div className="mt-3 space-y-2 rounded-xl border border-brass/35 bg-[#140f09]/80 p-3">
          <p className="label text-[14px] text-brass">RÉPARTITION — {currentSeller ?? 'VENDEUR NON SÉLECTIONNÉ'}</p>
          <div className="flex items-center justify-between gap-3 text-[16px]">
            <span className="flex items-center gap-2"><Store size={16} className="text-brass" /> À METTRE EN CAISSE</span>
            <b className="font-type text-2xl text-brass">{money(allocation.shopShare)}</b>
          </div>
          <div className="flex items-center justify-between gap-3 text-[16px]">
            <span className="flex items-center gap-2"><Wallet size={16} className="text-sage" /> À GARDER POUR LE VENDEUR</span>
            <b className="font-type text-2xl text-sage">{money(allocation.sellerShare)}</b>
          </div>
          <Row label="Coût de fabrication total" value={money(allocation.manufacturingCost)} />
          {totals.tax > 0 && <p className="text-[12px] text-sepia">La taxe client ({money(totals.tax)}) est reversée intégralement à la boutique.</p>}
        </div>
      )}

      {/* Encaissement */}
      <div className="mt-3 flex gap-2">
        <input className="field" inputMode="decimal" placeholder={`Reçu du client (${money(totals.total)})`} value={received} onChange={(e) => setReceived(e.target.value)} aria-label="Montant reçu du client" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <QuickBtn onClick={() => setReceived(String(totals.total))}>Compte juste</QuickBtn>
        {quickCash.map((v) => (
          <QuickBtn key={v} onClick={() => setReceived(String(v))}>
            ${v}
          </QuickBtn>
        ))}
      </div>
      {received !== '' && (
        <p className={cn('label mt-2 text-right text-[18px]', change < 0 ? 'text-blood' : 'text-sage')}>
          {change < 0 ? `Manque ${money(-change)}` : `À rendre : ${money(change)}`}
        </p>
      )}

      <button
        disabled={empty || busy}
        onClick={() => onFinish('payee')}
        className="mt-4 cursor-pointer rounded-2xl border border-white/15 bg-gradient-to-b from-[#e3262f] to-[#a3121a] py-3.5 text-center font-western text-[30px] tracking-[.2em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_14px_34px_-12px_rgba(208,27,37,.85)] transition hover:-translate-y-px hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_18px_40px_-12px_rgba(208,27,37,1)] active:translate-y-0 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
      >
        ENCAISSER
      </button>

      {/* Invites clavier façon jeu */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[15px] text-sepia">
        <Prompt k="Entrée" onClick={() => onFinish('payee')} disabled={empty || busy}>
          Encaisser
        </Prompt>
        <Prompt k="C" onClick={() => onFinish('en_attente')} disabled={empty || busy}>
          En commande
        </Prompt>
        <Prompt k="Suppr" onClick={clearCart} disabled={empty && !cart.clientId}>
          Vider
        </Prompt>
      </div>
    </section>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className="font-type text-[17px] text-ink">{value}</span>
  </div>
)

const QuickBtn = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="label cursor-pointer rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-[14px] text-sepia transition hover:border-white/25 hover:text-ink">
    {children}
  </button>
)

function Prompt({ k, children, onClick, disabled }: { k: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex cursor-pointer items-center gap-2 transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-35">
      <span className="keycap">{k}</span>
      {children}
    </button>
  )
}
