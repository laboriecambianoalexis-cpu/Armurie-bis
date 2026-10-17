import { ChevronLeft, ChevronRight, Landmark, Minus, Plus, Scale, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Field, Modal, useConfirm } from '@/components/ui'
import { BalanceChart, ChartCard, FlowBars } from './Charts'
import { useRachat } from '@/lib/rachat'
import { buildJournal, KIND_LABEL, periodRange, useLedger, type Period } from '@/lib/ledger'
import { useStore } from '@/lib/store'
import { cn, fmtDate, money, normName, toNum } from '@/lib/utils'

type Flow = 'tout' | 'entrees' | 'sorties'
type Dialog = { kind: 'depot' | 'retrait' } | { kind: 'ajustement' } | null

/** Livre de compte façon relevé en jeu : solde, journal des entrées / sorties, balance de la période. */
export function Journal() {
  const { orders, products, settings } = useStore()
  const { available, entries, add, remove } = useLedger()
  const [period, setPeriod] = useState<Period>('mois')
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState('')
  const [flow, setFlow] = useState<Flow>('tout')
  const [dialog, setDialog] = useState<Dialog>(null)
  const { ask, dialog: confirmDialog } = useConfirm()

  const buybacks = useRachat((s) => s.items)
  const journal = useMemo(() => buildJournal(orders, products, entries, buybacks), [orders, products, entries, buybacks])
  const balance = journal.at(-1)?.balance ?? 0
  const range = periodRange(period, offset)
  const rows = journal
    .filter((e) => e.createdAt >= range.start && e.createdAt < range.end)
    .filter((e) => flow === 'tout' || (flow === 'entrees' ? e.amount > 0 : e.amount < 0))
    .filter((e) => !q || normName(`${e.author} ${e.label} ${KIND_LABEL[e.kind]}`).includes(normName(q)))
    .reverse()
  const periodBalance = rows.reduce((s, e) => s + e.amount, 0)

  // ——— données des graphiques (tous les mouvements de la période, sans filtre texte) ———
  const inRange = journal.filter((e) => e.createdAt >= range.start && e.createdAt < range.end)
  const startBalance = journal.filter((e) => e.createdAt < range.start).at(-1)?.balance ?? 0
  const endT = Math.min(range.end, Date.now())
  const fmtPt = (t: number) => new Date(t).toLocaleString('fr-FR', period === 'jour' ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const balancePoints = [
    { t: range.start, label: fmtPt(range.start), v: startBalance },
    // une vente et sa taxe tombent à la même minute : on ne garde que le solde après les deux (pas de pic)
    ...inRange
      .filter((e, i) => !(inRange[i + 1] && inRange[i + 1].createdAt - e.createdAt < 60000))
      .map((e) => ({ t: e.createdAt, label: fmtPt(e.createdAt), v: e.balance })),
    { t: endT, label: fmtPt(endT), v: inRange.at(-1)?.balance ?? startBalance },
  ]
  const bucketMs = period === 'jour' ? 3600000 : 86400000
  const nBuckets = Math.round((range.end - range.start) / bucketMs)
  const buckets = Array.from({ length: nBuckets }, (_, i) => {
    const t = range.start + i * bucketMs
    return { label: period === 'jour' ? `${new Date(t).getHours()}h` : new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), in: 0, out: 0 }
  })
  for (const e of inRange) {
    // les journées ne font pas toujours 24 h (changement d'heure) : on retombe sur l'index le plus proche
    const i = Math.min(nBuckets - 1, Math.floor((e.createdAt - range.start) / bucketMs))
    if (e.amount >= 0) buckets[i].in += e.amount
    else buckets[i].out += e.amount
  }

  return (
    <section className="glass-panel p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-western text-[38px] leading-none tracking-[.06em]">COMPTABILITÉ</h2>
          <p className="mt-1 text-sepia italic">{settings.shopName}</p>
        </div>
        <div className="text-right">
          <p className="label text-[15px] text-sepia">Solde du compte</p>
          <p className={cn('font-type text-5xl tracking-[.02em]', balance < 0 ? 'text-blood' : 'text-brass')}>{money(balance)}</p>
        </div>
      </header>

      {available === false ? (
        <p className="mt-4 text-brass">La table du livre de compte n'existe pas encore : seules les ventes et taxes sont affichées.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="ink" onClick={() => setDialog({ kind: 'depot' })}>
            <Plus size={14} /> Dépôt
          </Button>
          <Button size="sm" variant="ink" onClick={() => setDialog({ kind: 'retrait' })}>
            <Minus size={14} /> Retrait
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'ajustement' })}>
            <Scale size={14} /> Caler sur le solde du jeu
          </Button>
        </div>
      )}

      {/* filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        {(['jour', 'semaine', 'mois'] as Period[]).map((p) => (
          <label key={p} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="periode"
              className="size-4 accent-[#d6a54d]"
              checked={period === p}
              onChange={() => {
                setPeriod(p)
                setOffset(0)
              }}
            />
            <span className="label text-[17px]">{p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : 'Mois'}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_240px]">
        <input className="field" placeholder="Auteur, libellé…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field" value={flow} onChange={(e) => setFlow(e.target.value as Flow)}>
          <option value="tout">Toutes les entrées et sorties</option>
          <option value="entrees">Entrées seulement</option>
          <option value="sorties">Sorties seulement</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ink" onClick={() => setOffset((o) => o - 1)} aria-label="Période précédente">
            <ChevronLeft size={15} /> Précédent
          </Button>
          <span className="label px-2 text-[18px] text-brass">{range.label}</span>
          <Button size="sm" variant="ink" disabled={offset >= 0} onClick={() => setOffset((o) => Math.min(0, o + 1))} aria-label="Période suivante">
            Suivant <ChevronRight size={15} />
          </Button>
        </div>
        <div className="text-right">
          <p className="label text-[14px] text-sepia">Balance de la période</p>
          <p className={cn('font-type text-4xl', periodBalance < 0 ? 'text-blood' : 'text-sage')}>
            {periodBalance >= 0 ? '+' : ''}
            {money(periodBalance)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Évolution du solde" subtitle={range.label}>
          <BalanceChart points={balancePoints} />
        </ChartCard>
        <ChartCard title={period === 'jour' ? 'Entrées / sorties par heure' : 'Entrées / sorties par jour'} subtitle="Vert au-dessus de zéro : gain · rouge en dessous : perte">
          <FlowBars buckets={buckets} />
        </ChartCard>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="ledger w-full min-w-[820px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opération</th>
              <th>Auteur</th>
              <th>Détail</th>
              <th className="text-right!">Montant</th>
              <th className="text-right!">Solde</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sepia italic">
                  Aucun mouvement sur cette période.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="group">
                  <td className="font-type text-[16px] whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                  <td className="text-[16px]">{KIND_LABEL[e.kind]}</td>
                  <td className="text-[16px]">{e.author || '—'}</td>
                  <td className="max-w-md truncate text-[15.5px] text-parch-2" title={e.label}>
                    {e.label}
                  </td>
                  <td className={cn('text-right font-type text-xl whitespace-nowrap', e.amount < 0 ? 'text-blood' : 'text-sage')}>
                    {e.amount >= 0 ? '+' : '−'}
                    {money(Math.abs(e.amount))}
                  </td>
                  <td className="text-right font-type text-xl whitespace-nowrap">{money(e.balance)}</td>
                  <td className="w-8 text-right">
                    {e.manual && (
                      <button
                        className="cursor-pointer p-1 text-sepia-2 opacity-0 transition group-hover:opacity-100 hover:text-blood"
                        onClick={async () => {
                          if (await ask(`Supprimer ce mouvement (${money(e.amount)}) ?`)) await remove(e.id).catch((err) => toast.error(err.message))
                        }}
                        aria-label="Supprimer le mouvement"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[14px] text-sepia italic">
        Ventes encaissées et frais admin / taxes de fabrication ajoutés automatiquement ; dépôts, retraits et ajustements saisis à la main.
      </p>

      <Modal
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog?.kind === 'ajustement' ? 'Caler sur le solde du jeu' : dialog?.kind === 'depot' ? 'Nouveau dépôt' : 'Nouveau retrait'}
      >
        {dialog && (
          <MovementForm
            kind={dialog.kind}
            currentBalance={balance}
            onDone={() => setDialog(null)}
            onSubmit={async (v) => {
              try {
                await add(v)
                toast.success('Mouvement enregistré.')
                setDialog(null)
              } catch (err) {
                toast.error(`Base de données : ${(err as Error).message}`)
              }
            }}
          />
        )}
      </Modal>
      {confirmDialog}
    </section>
  )
}

function MovementForm({
  kind,
  currentBalance,
  onSubmit,
  onDone,
}: {
  kind: 'depot' | 'retrait' | 'ajustement'
  currentBalance: number
  onSubmit: (v: { kind: 'depot' | 'retrait' | 'ajustement'; author: string; label: string; amount: number }) => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [author, setAuthor] = useState('')
  const [label, setLabel] = useState('')
  const target = toNum(amount)
  const diff = target - currentBalance

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (kind === 'ajustement') {
      if (amount === '') return toast.error('Indiquez le solde affiché en jeu.')
      if (Math.abs(diff) < 0.005) return toast('Le solde est déjà juste.')
      return onSubmit({ kind, author: author || 'Banque', label: label || `Ajustement sur le relevé (${money(target)})`, amount: diff })
    }
    if (!target) return toast.error('Indiquez un montant.')
    if (!label.trim()) return toast.error('Indiquez le libellé (ex. achat de plomb).')
    onSubmit({ kind, author, label, amount: target })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={kind === 'ajustement' ? 'Solde affiché en jeu ($)' : 'Montant ($)'}>
        <input className="field text-lg" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={kind === 'ajustement' ? '747,15' : '12,00'} />
      </Field>
      {kind === 'ajustement' && amount !== '' && (
        <p className="text-[15px] text-sepia">
          Solde du site : {money(currentBalance)} → écart{' '}
          <b className={cn('font-type text-lg', diff < 0 ? 'text-blood' : 'text-sage')}>
            {diff >= 0 ? '+' : '−'}
            {money(Math.abs(diff))}
          </b>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Auteur">
          <input className="field" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={80} placeholder={kind === 'ajustement' ? 'Banque' : 'Wade Caldwell'} />
        </Field>
        <Field label="Libellé">
          <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} placeholder={kind === 'retrait' ? 'Achat de 600 plombs' : kind === 'depot' ? 'Apport' : 'Relevé du soir'} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          <Landmark size={16} /> Enregistrer
        </Button>
      </div>
    </form>
  )
}
