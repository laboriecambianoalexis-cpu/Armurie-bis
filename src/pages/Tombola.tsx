import { AnimatePresence, motion } from 'framer-motion'
import { Gift, History, Minus, Plus, RotateCcw, Ticket, Trash2, Trophy, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Button, Empty, Field, Panel, useConfirm } from '@/components/ui'
import { drawWinner, useExtras, type RaffleEntry } from '@/lib/extras'
import { prefersReducedMotion } from '@/lib/motion'
import { fmtDate, money } from '@/lib/utils'
import { ExtrasUnavailable } from '@/pages/Partenaires'

/* Lots de la tombola en cours et gagnants déjà tirés (gardés sur ce PC : le tirage se fait sur une seule caisse). */
interface LotResult {
  /** index du lot dans la liste (absent sur les anciens tirages = ordre de tirage) */
  lot?: number
  prize: string
  winner: string
  winnerTickets: number
}
interface LotsState {
  lots: string[]
  results: LotResult[]
  onePerPerson: boolean
  ticketPrice: number
}
const useLots = create<LotsState & { set: (p: Partial<LotsState>) => void }>()(
  persist((set) => ({ lots: [], results: [], onePerPerson: true, ticketPrice: 0, set: (p) => set(p) }), {
    name: 'armurerie-tombola-lots',
    partialize: ({ lots, results, onePerPerson, ticketPrice }) => ({ lots, results, onePerPerson, ticketPrice }),
  }),
)

export default function Tombola() {
  const { available, entries, draws, addTickets, setTickets, deleteEntry, recordDraw, resetRaffle } = useExtras()
  const [name, setName] = useState('')
  const [tickets, setTicketsInput] = useState('1')
  const [lotInput, setLotInput] = useState('')
  const { lots, results, onePerPerson, ticketPrice, set: setLots } = useLots()
  const [rolling, setRolling] = useState<string | null>(null)
  const [winner, setWinner] = useState<RaffleEntry | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const { ask, dialog } = useConfirm()

  const total = entries.reduce((s, e) => s + e.tickets, 0)
  // sans lot saisi : un seul tirage « libre », comme avant
  const plannedLots = lots.length ? lots : ['']
  const resultOf = new Map(results.map((r, i) => [r.lot ?? i, r]))
  const remaining = plannedLots.map((_, i) => i).filter((i) => !resultOf.has(i))
  // lot choisi par l'utilisateur, sinon le premier pas encore tiré
  const current = selected !== null && remaining.includes(selected) ? selected : (remaining[0] ?? null)
  const nextLot = current === null ? null : plannedLots[current]
  const lastResult = results.at(-1)
  const won = new Set(results.map((r) => r.winner))
  const pool = onePerPerson ? entries.filter((e) => !won.has(e.name)) : entries
  const poolTotal = pool.reduce((s, e) => s + e.tickets, 0)
  const sorted = [...entries].sort((a, b) => b.tickets - a.tickets || a.name.localeCompare(b.name, 'fr'))
  const safe = async (f: () => Promise<unknown>) => {
    try {
      await f()
    } catch (err) {
      toast.error(`Base de données : ${(err as Error).message}`)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.floor(Number(tickets))
    if (!name.trim()) return toast.error('Indiquez le nom et le prénom du participant.')
    if (!Number.isFinite(n) || n < 1) return toast.error('Au moins 1 ticket.')
    await safe(async () => {
      await addTickets(name, n)
      toast.success(`${n} ticket(s) pour ${name.trim()}.`)
      setName('')
      setTicketsInput('1')
      nameRef.current?.focus()
    })
  }

  async function draw() {
    if (!pool.length || rolling || current === null || nextLot === null) return
    const lotLabel = nextLot ? `le lot ${current + 1} « ${nextLot} »` : 'le lot'
    if (!(await ask(`Tirer ${lotLabel} entre ${pool.length} participant(s) pour ${poolTotal} ticket(s) ?`))) return
    const win = drawWinner(pool)!
    setWinner(null)
    // petite animation : les noms défilent puis ralentissent sur le gagnant
    if (!prefersReducedMotion()) {
      const names = pool.map((e) => e.name)
      for (let i = 0; i < 26; i++) {
        setRolling(names[Math.floor(Math.random() * names.length)])
        await new Promise((r) => setTimeout(r, 40 + i * i * 0.9))
      }
    }
    setRolling(null)
    setWinner(win)
    setLots({ results: [...results, { lot: current, prize: nextLot, winner: win.name, winnerTickets: win.tickets }] })
    setSelected(null)
    await safe(() => recordDraw({ winner: win.name, winnerTickets: win.tickets, totalTickets: poolTotal, participants: pool.length, prize: nextLot }))
  }

  function addLot(e: React.FormEvent) {
    e.preventDefault()
    const l = lotInput.trim()
    if (!l) return
    setLots({ lots: [...lots, l] })
    setLotInput('')
  }

  if (available === false)
    return (
      <Panel title="Tombola" icon={<Ticket />}>
        <ExtrasUnavailable />
      </Panel>
    )

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Panel
        title="Tombola"
        icon={<Ticket />}
        actions={
          (entries.length > 0 || lots.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (await ask('Nouvelle tombola : vider la liste des participants et des lots ? (l’historique des tirages est conservé)')) {
                  await safe(resetRaffle)
                  setLots({ lots: [], results: [] })
                  setWinner(null)
                  setSelected(null)
                }
              }}
            >
              <RotateCcw size={14} /> Nouvelle tombola
            </Button>
          )
        }
      >
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">
          <Field label="Nom & prénom">
            <input ref={nameRef} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Arthur Morgan" list="tombola-noms" />
          </Field>
          <Field label="Tickets achetés">
            <input className="field" inputMode="numeric" value={tickets} onChange={(e) => setTicketsInput(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Button type="submit" variant="blood">
            <Plus size={17} /> Ajouter
          </Button>
          <datalist id="tombola-noms">
            {entries.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
        </form>
        <p className="mt-2 text-[14.5px] text-sepia italic">Si le participant est déjà inscrit, ses nouveaux tickets s’ajoutent aux précédents.</p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-2">
          <label className="flex items-center gap-2">
            <span className="label text-[15px] text-sepia">Prix du billet</span>
            <span className="relative">
              <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-sepia">$</span>
              <input
                className="field w-24 py-1 pl-6"
                inputMode="decimal"
                defaultValue={ticketPrice || ''}
                placeholder="0"
                onChange={(e) => {
                  const v = Number(e.target.value.replace(',', '.'))
                  setLots({ ticketPrice: Number.isFinite(v) && v > 0 ? v : 0 })
                }}
              />
            </span>
          </label>
          <div className="text-right">
            <p className="font-type text-3xl leading-none tracking-[.02em]">
              {total} <span className="text-[18px] text-sepia">ticket(s) · {entries.length} participant(s)</span>
            </p>
            {ticketPrice > 0 && (
              <p className="mt-1 text-[16px]">
                <span className="text-sepia">Recette : </span>
                <b className="font-type text-2xl text-brass">{money(total * ticketPrice)}</b>
              </p>
            )}
          </div>
        </div>

        {sorted.length === 0 ? (
          <Empty icon={<Ticket size={32} />}>Aucun participant pour l’instant.</Empty>
        ) : (
          <ul className="divide-y divide-white/[.06]">
            {sorted.map((e) => {
              const pct = total ? (e.tickets / total) * 100 : 0
              return (
                <li key={e.id} className="group flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px]">{e.name}</p>
                    <div className="statbar mt-1.5 max-w-xs">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-14 text-right text-[14px] text-sepia">{pct.toFixed(1)} %</span>
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[.03]">
                    <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => safe(() => (e.tickets > 1 ? setTickets(e.id, e.tickets - 1) : deleteEntry(e.id)))} aria-label="Retirer un ticket">
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center font-type text-[19px]">{e.tickets}</span>
                    <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => safe(() => setTickets(e.id, e.tickets + 1))} aria-label="Ajouter un ticket">
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    className="cursor-pointer rounded p-1 text-sepia-2 opacity-60 transition hover:text-blood group-hover:opacity-100"
                    onClick={async () => {
                      if (await ask(`Retirer ${e.name} de la tombola ?`)) await safe(() => deleteEntry(e.id))
                    }}
                    aria-label={`Retirer ${e.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <div className="space-y-5 self-start lg:sticky lg:top-24">
        {/* ——— Tirage ——— */}
        <section className="glass-panel p-5">
          <h2 className="flex items-center gap-2.5 font-western text-[28px] tracking-[.08em]">
            <Trophy className="text-brass" /> TIRAGE AU SORT
          </h2>
          {/* ——— Lots ——— */}
          <form onSubmit={addLot} className="mt-3 flex gap-2">
            <input className="field" value={lotInput} onChange={(e) => setLotInput(e.target.value)} maxLength={120} placeholder="Ajouter un lot : Revolver Cattleman gravé…" />
            <Button type="submit" variant="ink" disabled={!lotInput.trim()} aria-label="Ajouter le lot">
              <Plus size={17} />
            </Button>
          </form>
          <p className="mt-1.5 text-[13.5px] text-sepia italic">
            Clique sur un lot pour choisir celui à tirer, dans l’ordre que tu veux.
          </p>
          {lots.length > 0 && (
            <ol className="mt-2 space-y-1">
              {lots.map((l, i) => {
                const r = resultOf.get(i)
                const isSel = !r && i === current
                return (
                  <li key={i}>
                    <div
                      role={r ? undefined : 'button'}
                      tabIndex={r ? undefined : 0}
                      onClick={() => !r && !rolling && setSelected(i)}
                      onKeyDown={(e) => !r && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(i))}
                      aria-pressed={r ? undefined : isSel}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[15.5px] transition ${
                        r ? 'border-brass/40 bg-brass/10' : isSel ? 'cursor-pointer border-blood bg-blood/15 shadow-[0_0_16px_-6px_rgba(208,27,37,.8)]' : 'cursor-pointer border-white/8 hover:border-white/25'
                      }`}
                    >
                      <Gift size={15} className={r ? 'text-brass' : isSel ? 'text-blood' : 'text-sepia'} />
                      <span className="font-type text-sepia">{i + 1}.</span>
                      <span className="min-w-0 flex-1 truncate">{l}</span>
                      {r ? (
                        <b className="truncate font-semibold text-brass">{r.winner}</b>
                      ) : (
                        <>
                          {isSel && <span className="label text-[12px] text-blood">À tirer</span>}
                          {results.length === 0 && (
                            <button
                              className="cursor-pointer text-sepia-2 hover:text-blood"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLots({ lots: lots.filter((_, j) => j !== i) })
                                setSelected(null)
                              }}
                              aria-label={`Retirer ${l}`}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-[14.5px] text-sepia">
            <input type="checkbox" className="accent-[#d01b25]" checked={onePerPerson} onChange={(e) => setLots({ onePerPerson: e.target.checked })} />
            Un seul lot par personne
          </label>

          <div className="mt-4 grid min-h-32 place-items-center rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <AnimatePresence mode="wait">
              {rolling ? (
                <motion.p key="roll" className="font-western text-4xl tracking-[.04em] text-parch-2">
                  {rolling.toUpperCase()}
                </motion.p>
              ) : winner ? (
                <motion.div key={`${winner.id}-${results.length}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                  <p className="label text-[15px] text-brass">{lastResult?.prize ? `Gagnant du lot ${(lastResult.lot ?? results.length - 1) + 1} · ${lastResult.prize}` : 'Le gagnant est'}</p>
                  <p className="font-western text-5xl leading-none tracking-[.04em] [text-shadow:0_0_30px_rgba(214,165,77,.45)]">{winner.name.toUpperCase()}</p>
                  <p className="mt-1 text-[15px] text-sepia">avec {winner.tickets} ticket(s)</p>
                </motion.div>
              ) : (
                <motion.p key="idle" className="text-sepia italic">
                  {entries.length ? 'Chaque ticket compte pour une chance.' : 'Ajoutez des participants pour lancer le tirage.'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={draw}
            disabled={!pool.length || !!rolling || current === null}
            className="mt-4 w-full cursor-pointer rounded-2xl border border-white/15 bg-gradient-to-b from-[#e6b65d] to-[#a8741f] py-3 font-western text-[26px] tracking-[.18em] text-[#1a120c] shadow-[0_14px_34px_-12px_rgba(214,165,77,.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {current === null ? 'TOUS LES LOTS SONT TIRÉS' : plannedLots.length > 1 ? `TIRER LE LOT ${current + 1}` : 'TIRER AU SORT'}
          </button>
          {current === null && (
            <button
              className="mt-2 w-full cursor-pointer text-[14px] text-sepia underline-offset-2 hover:text-ink hover:underline"
              onClick={() => {
                setLots({ results: [] })
                setWinner(null)
                setSelected(null)
              }}
            >
              Refaire les tirages avec les mêmes lots
            </button>
          )}
          {current !== null && entries.length > 0 && !pool.length && <p className="mt-2 text-center text-[14px] text-blood">Plus personne à tirer : tous les participants ont déjà gagné.</p>}
        </section>

        {/* ——— Historique ——— */}
        <section className="glass-panel p-5">
          <h2 className="flex items-center gap-2.5 font-western text-[24px] tracking-[.08em]">
            <History className="text-blood" size={20} /> HISTORIQUE DES TIRAGES
          </h2>
          {draws.length === 0 ? (
            <p className="mt-3 text-sepia italic">Aucun tirage pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/[.06]">
              {draws.slice(0, 12).map((d) => (
                <li key={d.id} className="py-2">
                  <p className="text-[16.5px]">
                    <b className="font-semibold">{d.winner}</b> {d.prize && <span className="text-brass">· {d.prize}</span>}
                  </p>
                  <p className="text-[13.5px] text-sepia">
                    {fmtDate(d.createdAt)} · {d.winnerTickets}/{d.totalTickets} tickets · {d.participants} participant(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {dialog}
    </div>
  )
}
