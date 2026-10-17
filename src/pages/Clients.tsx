import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, BadgeX, Crosshair, Merge, Pencil, Search, ShoppingCart, Trash2, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Empty, Field, Modal, Panel, StatusStamp, useConfirm } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import type { Client } from '@/lib/types'
import { ItemArt } from '@/components/ItemArt'
import { cn, fmtDate, isWeapon, money, normName, orderNo } from '@/lib/utils'

export function ClientForm({ client, onDone }: { client?: Client; onDone: (c?: Client) => void }) {
  const saveClient = useStore((s) => s.saveClient)
  const clients = useStore((s) => s.clients)
  const [f, setF] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    license: client?.license ?? '',
    licenseValid: client?.licenseValid ?? true,
    notes: client?.notes ?? '',
  })
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const name = f.name.trim()
    if (!name) return toast.error('Il faut au moins un nom.')
    const twin = clients.find((c) => c.id !== client?.id && normName(c.name) === normName(name))
    if (twin) return toast.error(`${twin.name} existe déjà dans le registre.`, { description: 'Choisissez-le dans la liste au lieu d’en créer un nouveau.' })
    const saved = saveClient({ ...f, name, phone: f.phone.trim(), license: f.license.trim(), notes: f.notes.trim(), id: client?.id })
    toast.success(client ? 'Fiche client mise à jour.' : `${name} inscrit au registre.`)
    onDone(saved)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nom & prénom *">
        <input className="field" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Arthur Morgan" maxLength={80} />
        {f.name.trim() && clients.some((c) => c.id !== client?.id && normName(c.name) === normName(f.name)) && (
          <span className="mt-1 block text-sm text-blood">Ce client existe déjà.</span>
        )}
      </Field>
      <Field label="Téléphone / télégramme">
        <input className="field" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="555-0199" maxLength={30} />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input type="checkbox" className="size-4 accent-[#a8171c]" checked={f.licenseValid} onChange={(e) => set({ licenseValid: e.target.checked })} />
        Permis valide
      </label>
      <Field label="Notes">
        <textarea className="field min-h-20" value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Préférences, dettes, avertissements…" maxLength={500} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => onDone()}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          {client ? 'Enregistrer' : 'Inscrire au registre'}
        </Button>
      </div>
    </form>
  )
}

export default function Clients() {
  const { clients, orders, products, deleteClient, setCart, cart } = useStore()
  const setTab = useUi((s) => s.setTab)

  /** Ouvre la caisse avec ce client déjà sélectionné : la commande lui sera liée. */
  function newOrder(c: Client) {
    const other = cart.items.length > 0 && cart.clientId !== c.id
    setCart({ clientId: c.id })
    setViewing(null)
    setTab('caisse')
    toast(`Nouvelle commande pour ${c.name}`, { description: other ? 'Les articles déjà sur la note sont conservés.' : undefined })
  }
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Client | 'new' | null>(null)
  const [viewing, setViewing] = useState<Client | null>(null)
  const { ask, dialog } = useConfirm()

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; spent: number; last: number }>()
    for (const o of orders) {
      if (!o.clientId || o.status === 'annulee') continue
      const s = m.get(o.clientId) ?? { count: 0, spent: 0, last: 0 }
      m.set(o.clientId, { count: s.count + 1, spent: s.spent + o.total, last: Math.max(s.last, o.createdAt) })
    }
    return m
  }, [orders])

// fiches portant le même nom (doublons à regrouper)
  const dupGroups = useMemo(() => {
    const m = new Map<string, Client[]>()
    for (const c of clients) m.set(normName(c.name), [...(m.get(normName(c.name)) ?? []), c])
    return [...m.values()].filter((g) => g.length > 1)
  }, [clients])
  const { mergeClients } = useStore()
  async function mergeAll() {
    if (!(await ask(`Regrouper ${dupGroups.length} client(s) en double ? Leurs ventes seront réunies sur une seule fiche.`))) return
    for (const g of dupGroups) {
      const sorted = [...g].sort((a, b) => a.createdAt - b.createdAt)
      mergeClients(sorted[0].id, sorted.slice(1).map((c) => c.id))
    }
    toast.success('Doublons regroupés.')
  }
  const list = clients.filter((c) => [c.name, c.phone].join(' ').toLowerCase().includes(q.toLowerCase()))

  async function remove(c: Client) {
    if (await ask(`Rayer ${c.name} du registre ? Ses commandes resteront dans l'historique.`)) {
      deleteClient(c.id)
      toast('Client rayé du registre.')
    }
  }

  const history = viewing ? orders.filter((o) => o.clientId === viewing.id) : []

  // Armes achetées par le client : une ligne par exemplaire
  const weapons = history.flatMap((o) =>
    o.items
      .filter((i) => isWeapon(products.find((p) => p.id === i.productId)?.category))
      .flatMap((i) => Array.from({ length: i.qty }, (_, k) => ({ key: `${o.id}-${i.productId}-${k}`, item: i, order: o }))),
  )

  return (
    <Panel
      title="Registre des clients"
      icon={<Users />}
      actions={
        <Button variant="blood" onClick={() => setEditing('new')}>
          <UserPlus size={18} /> Nouveau client
        </Button>
      }
    >
      {dupGroups.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brass/40 bg-brass/10 px-4 py-2.5">
          <span className="flex-1">
            <b className="font-semibold">Doublons :</b> {dupGroups.map((g) => `${g[0].name} (×${g.length})`).join(', ')}
          </span>
          <Button size="sm" variant="brass" onClick={mergeAll}>
            <Merge size={14} /> Regrouper
          </Button>
        </div>
      )}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={16} />
        <input className="field pl-9" placeholder="Nom, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <Empty icon={<Users size={36} />}>{clients.length ? 'Personne ne correspond.' : 'Aucun client inscrit pour l’instant.'}</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[640px]">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Permis</th>
                <th className="text-right!">Achats</th>
                <th className="text-right!">Total dépensé</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {list.map((c) => {
                  const s = stats.get(c.id)
                  return (
                    <motion.tr key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cursor-pointer" onClick={() => setViewing(c)}>
                      <td className="text-lg">{c.name}</td>
                      <td className="font-type text-[17px] tracking-[.04em]">{c.phone || '—'}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 font-type text-[17px] tracking-[.04em] ${c.licenseValid ? 'text-sage' : 'text-blood'}`}>
                          {c.licenseValid ? <BadgeCheck size={16} /> : <BadgeX size={16} />}
                          {c.licenseValid ? 'Valide' : 'Aucun'}
                        </span>
                      </td>
                      <td className="text-right font-type">{s?.count ?? 0}</td>
                      <td className="text-right font-type">{money(s?.spent ?? 0)}</td>
                      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ink" className="mr-1" onClick={() => newOrder(c)} title="Nouvelle commande pour ce client">
                          <ShoppingCart size={14} /> Commande
                        </Button>
                        <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => setEditing(c)} aria-label="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button className="cursor-pointer p-1.5 text-sepia hover:text-blood" onClick={() => remove(c)} aria-label="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nouveau client' : 'Modifier la fiche'}>
        {editing && <ClientForm client={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.name ?? ''} wide>
        {viewing && (
          <div className="space-y-4 text-ink">
            <div className="grid gap-2 font-type text-[17px] tracking-[.04em] sm:grid-cols-3">
              <p>Tél : {viewing.phone || '—'}</p>
              <p>Permis : {viewing.licenseValid ? 'valide ✔' : 'aucun ✘'}</p>
              <p>Inscrit le {fmtDate(viewing.createdAt).split(' ')[0]}</p>
            </div>
            {viewing.notes && <p className="italic">« {viewing.notes} »</p>}
            <Button variant="blood" onClick={() => newOrder(viewing)}>
              <ShoppingCart size={16} /> Nouvelle commande pour {viewing.name}
            </Button>
            <p className="ornament font-sc">Armes achetées ({weapons.filter((w) => w.order.status !== 'annulee').length})</p>
            {weapons.length === 0 ? (
              <Empty icon={<Crosshair size={28} />}>Aucune arme achetée.</Empty>
            ) : (
              <ul className="divide-y divide-dashed divide-sepia/30">
                {weapons.map(({ key, item, order }) => {
                  const product = products.find((p) => p.id === item.productId)
                  const cancelled = order.status === 'annulee'
                  return (
                    <li key={key} className={cn('flex items-center gap-3 py-2', cancelled && 'opacity-50')}>
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/[.05] p-1">
                        {product && <ItemArt product={product} className="size-full" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('leading-tight', cancelled && 'line-through')}>{item.name}</p>
                        <p className="font-type text-[15px] tracking-[.04em] text-sepia">
                          {orderNo(order.number)} · {fmtDate(order.createdAt)}
                          {cancelled && ' · annulée'}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <p className="ornament font-sc">Historique des achats</p>
            {history.length === 0 ? (
              <Empty icon={<Users size={28} />}>Aucun achat pour le moment.</Empty>
            ) : (
              <table className="ledger w-full text-sm">
                <tbody>
                  {history.map((o) => (
                    <tr key={o.id}>
                      <td className="font-type">{orderNo(o.number)}</td>
                      <td className="font-type">{fmtDate(o.createdAt)}</td>
                      <td>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                      <td>
                        <StatusStamp status={o.status} />
                      </td>
                      <td className="text-right font-type">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>
      {dialog}
    </Panel>
  )
}
