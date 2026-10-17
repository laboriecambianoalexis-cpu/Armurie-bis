import { Plus, ScrollText, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Receipt } from '@/components/Receipt'
import { Button, Empty, Modal, Panel, StatusStamp, useConfirm } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types'
import { cn, fmtDate, money, orderNo } from '@/lib/utils'

const FILTERS: (OrderStatus | 'toutes')[] = ['toutes', 'en_attente', 'payee', 'livree', 'annulee']

export default function Commandes() {
  const { orders, setOrderStatus, deleteOrder } = useStore()
  const setTab = useUi((s) => s.setTab)
  const [filter, setFilter] = useState<OrderStatus | 'toutes'>('toutes')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const { ask, dialog } = useConfirm()

  const list = orders.filter(
    (o) =>
      (filter === 'toutes' || o.status === filter) &&
      [orderNo(o.number), o.clientName, ...o.items.map((i) => i.name), o.seller ?? ''].join(' ').toLowerCase().includes(q.toLowerCase()),
  )
  const current = orders.find((o) => o.id === open) ?? null
  const pendingTotal = orders.filter((o) => o.status === 'en_attente').reduce((s, o) => s + o.total, 0)

  async function remove(o: Order) {
    if (await ask(`Supprimer définitivement la commande ${orderNo(o.number)} ?`)) {
      deleteOrder(o.id)
      setOpen(null)
      toast('Commande supprimée.')
    }
  }

  return (
    <Panel
      title="Livre des commandes"
      icon={<ScrollText />}
      actions={
        <>
          {pendingTotal > 0 && <span className="label text-[15px] text-brass">À encaisser : {money(pendingTotal)}</span>}
          <Button variant="blood" onClick={() => setTab('caisse')}>
            <Plus size={18} /> Nouvelle commande
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={16} />
          <input className="field pl-9" placeholder="N° de commande, client, article…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'label cursor-pointer rounded-full border px-3 py-1 text-[15px] transition',
                filter === f ? 'border-blood bg-blood text-white shadow-[0_0_18px_-4px_rgba(208,27,37,.7)]' : 'border-white/10 text-sepia hover:bg-white/[.06] hover:text-ink',
              )}
            >
              {f === 'toutes' ? 'Toutes' : STATUS_LABEL[f]} ({f === 'toutes' ? orders.length : orders.filter((o) => o.status === f).length})
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<ScrollText size={36} />}>Aucune commande dans le livre.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[720px]">
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Client</th>
                <th>Vendeur</th>
                <th>Articles</th>
                <th>Statut</th>
                <th className="text-right!">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => setOpen(o.id)}>
                  <td className="font-type">{orderNo(o.number)}</td>
                  <td className="font-type text-[17px] tracking-[.04em] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                  <td className="text-lg">{o.clientName}</td>
                  <td className="text-[16px] text-sepia">{o.seller ?? '—'}</td>
                  <td className="max-w-xs truncate text-sm text-sepia">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td>
                    <StatusStamp status={o.status} />
                  </td>
                  <td className="text-right font-type text-2xl">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!current} onOpenChange={(v) => !v && setOpen(null)} title={current ? `Commande ${orderNo(current.number)}` : ''}>
        {current && (
          <>
            <Receipt order={current} />
            <p className="mt-4 mb-2 font-sc text-sepia">Changer le statut</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={current.status === s ? 'blood' : 'ghost'}
                  onClick={() => {
                    setOrderStatus(current.id, s)
                    toast.success(`Commande ${orderNo(current.number)} : ${STATUS_LABEL[s]}.`)
                  }}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => remove(current)}>
                <Trash2 size={14} /> Supprimer
              </Button>
              <Button variant="ink" size="sm" onClick={() => window.print()}>
                Imprimer le reçu
              </Button>
            </div>
          </>
        )}
      </Modal>
      {dialog}
    </Panel>
  )
}
