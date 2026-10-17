import { Printer, Search, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CartPanel } from '@/components/caisse/CartPanel'
import { WeaponDetail } from '@/components/caisse/WeaponDetail'
import { WeaponTile } from '@/components/caisse/WeaponTile'
import { CustomWorkshop } from '@/components/CustomWorkshop'
import { Receipt } from '@/components/Receipt'
import { Button, Empty, Modal, useConfirm } from '@/components/ui'
import { WeaponSheetCard } from '@/components/WeaponSheetCard'
import { sheetFor, type WeaponSheet } from '@/lib/guide'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, type Order, type Product } from '@/lib/types'
import { cartTotals, useExtras } from '@/lib/extras'
import { cn, money, toNum } from '@/lib/utils'
import { ClientForm } from '@/pages/Clients'
import { useStaff } from '@/lib/staff'

type View = Category | 'Tout'

export default function Caisse() {
  const { products, clients, cart, settings, addToCart, setCart, clearCart, checkout } = useStore()
  const [q, setQ] = useState('')
  const [view, setView] = useState<View>('Tout')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [received, setReceived] = useState('')
  const [busy, setBusy] = useState(false)
  const [newClient, setNewClient] = useState(false)
  const [receipt, setReceipt] = useState<Order | null>(null)
  const [sheet, setSheet] = useState<WeaponSheet | null>(null)
  const { ask, dialog } = useConfirm()

  const shopCategories = CATEGORIES.filter((c) => c !== 'Personnalisation' && products.some((p) => p.category === c))
  const custom = products.filter((p) => p.category === 'Personnalisation')
  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.category !== 'Personnalisation' && (view === 'Tout' || p.category === view) && p.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [products, view, q],
  )
  const selected = products.find((p) => p.id === selectedId) ?? null
  const partners = useExtras((s) => s.partners)
  const totals = cartTotals(cart, products, settings, partners)
  const receivedNum = toNum(received)
  const client = clients.find((c) => c.id === cart.clientId)

  // Conseils de l'armurier pour les armes présentes sur la note
  const cartSheets = [
    ...new Map(
      cart.items
        .map((i) => products.find((p) => p.id === i.productId))
        .map((p) => (p ? sheetFor(p) : undefined))
        .filter((x): x is WeaponSheet => !!x)
        .map((x) => [x.id, x]),
    ).values(),
  ]
  const forbidden = cartSheets.filter((x) => x.tags.includes('jamais'))
  const suggestions = [...new Set(cartSheets.flatMap((x) => x.suggest ?? []))]
    .filter((id) => !cart.items.some((i) => i.productId === id))
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)

  const inCart = (id: string) => cart.items.find((i) => i.productId === id)?.qty ?? 0
  const add = (id: string, qty = 1) => addToCart(products.find((x) => x.id === id)!, qty)

  async function finish(status: 'payee' | 'en_attente') {
    if (!cart.items.length || busy) return
    const st = useStaff.getState()
    if (st.available && !st.currentId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return toast.error('Choisis d’abord qui vend (« Vendeur » en haut de la page).')
    }
    if (status === 'payee' && received && receivedNum < totals.total) return toast.error('Le montant reçu ne couvre pas la note.')
    if (forbidden.length && !(await ask(`${forbidden.map((f) => f.name).join(', ')} : arme à ne jamais vendre (formation). Vendre quand même ?`))) return
    if (client && !client.licenseValid && cart.items.some((i) => !['Munitions', 'Accessoires', 'Personnalisation'].includes(products.find((p) => p.id === i.productId)?.category ?? '')))
      toast.warning(`Attention : ${client.name} n'a pas de permis valide.`)
    setBusy(true)
    const order = await checkout(status, received ? receivedNum : totals.total)
    setBusy(false)
    if (!order) return
    setReceived('')
    setReceipt(order)
    toast.success(status === 'payee' ? `Vente ${money(order.total)} encaissée.` : 'Commande enregistrée — en attente.')
  }

  // Raccourcis clavier façon jeu (ignorés pendant la saisie ou si une fenêtre est ouverte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]') || document.querySelector('[role="dialog"]') || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        finish('payee')
      } else if (e.key.toLowerCase() === 'c') finish('en_attente')
      else if (e.key === 'Delete') clearCart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const SideItem = ({ v, label, count }: { v: View; label: string; count: number }) => (
    <button
      onClick={() => {
        setView(v)
        setSelectedId(null)
      }}
      className={cn(
        'label flex w-full shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-[19px] whitespace-nowrap transition xl:shrink',
        view === v ? 'bg-gradient-to-r from-blood/90 via-blood/40 to-transparent text-white shadow-[inset_3px_0_0_#fff]' : 'text-sepia hover:bg-white/[.05] hover:text-ink',
      )}
    >
      {label}
      <span className="font-serif text-[14px] tracking-normal opacity-60">{count}</span>
    </button>
  )

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_400px] xl:grid-cols-[220px_1fr_400px]">
      {/* ——— Catégories ——— */}
      <nav className="glass-panel flex gap-1 self-start overflow-x-auto p-2 scroll-thin lg:col-span-2 xl:col-span-1 xl:sticky xl:top-24 xl:flex-col" aria-label="Catégories">
        <SideItem v="Tout" label="Tout" count={products.length - custom.length} />
        {shopCategories.map((c) => (
          <SideItem key={c} v={c} label={c === 'Armes de jet & blanches' ? 'Armes blanches' : c} count={products.filter((p) => p.category === c).length} />
        ))}
        {custom.length > 0 && (
          <>
            <div className="mx-3 my-1 hidden h-px bg-white/10 xl:block" />
            <SideItem v="Personnalisation" label="Atelier" count={custom.length} />
          </>
        )}
      </nav>

      {/* ——— Étalage ——— */}
      <main className="min-w-0">
        {view === 'Personnalisation' ? (
          <div className="glass-panel p-5">
            <h2 className="mb-4 flex items-center gap-2.5 font-western text-[28px] tracking-[.08em]">
              <Wrench className="text-blood" /> ATELIER DE PERSONNALISATION
            </h2>
            <CustomWorkshop options={custom} inCart={inCart} onAdd={(id) => add(id)} />
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-sepia" size={18} />
              <input className="field h-12 rounded-2xl pl-11 text-[17px]" placeholder="Chercher une arme, des munitions…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {filtered.length === 0 ? (
              <div className="glass-panel">
                <Empty icon={<Search size={32} />}>Rien de tel dans nos râteliers.</Empty>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                {filtered.map((p) => (
                  <WeaponTile key={p.id} product={p} inCart={inCart(p.id)} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id === selectedId ? null : p.id)} onAdd={() => add(p.id)} />
                ))}
              </div>
            )}
            <WeaponDetail key={selected?.id ?? 'none'} product={selected} onAdd={(qty) => selected && add(selected.id, qty)} />
          </>
        )}
      </main>

      {/* ——— Note ——— */}
      <CartPanel
        received={received}
        setReceived={setReceived}
        busy={busy}
        cartSheets={cartSheets}
        forbidden={forbidden}
        suggestions={suggestions}
        onAdd={(id) => add(id)}
        onSheet={setSheet}
        onNewClient={() => setNewClient(true)}
        onFinish={finish}
      />

      <Modal open={newClient} onOpenChange={setNewClient} title="Nouveau client">
        <ClientForm
          onDone={(c) => {
            setNewClient(false)
            if (c) setCart({ clientId: c.id })
          }}
        />
      </Modal>

      <Modal open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} title={sheet?.name ?? ''}>
        {sheet && <WeaponSheetCard sheet={sheet} compact />}
      </Modal>
      {dialog}

      <Modal open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} title="Reçu">
        {receipt && (
          <>
            <Receipt order={receipt} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => window.print()}>
                <Printer size={16} /> Imprimer
              </Button>
              <Button variant="blood" onClick={() => setReceipt(null)}>
                Client suivant
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
