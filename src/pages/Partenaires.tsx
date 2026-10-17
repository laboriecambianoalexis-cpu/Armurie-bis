import { Handshake, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Empty, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { useExtras, type Partner } from '@/lib/extras'
import { useStore } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { clamp, money, toNum } from '@/lib/utils'

export function ExtrasUnavailable() {
  return (
    <Empty icon={<Handshake size={34} />}>
      Les tables « partenaires / tombola » ne sont pas encore créées dans la base. Demande à l'administrateur de lancer la mise à jour Supabase.
    </Empty>
  )
}

function PartnerForm({ partner, onDone }: { partner?: Partner; onDone: () => void }) {
  const savePartner = useExtras((s) => s.savePartner)
  const [name, setName] = useState(partner?.name ?? '')
  const [customPct, setCustomPct] = useState(String(partner?.customPct ?? 0))
  const [weaponsPct, setWeaponsPct] = useState(String(partner?.weaponsPct ?? 0))
  const [notes, setNotes] = useState(partner?.notes ?? '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Donnez un nom au partenaire.')
    try {
      await savePartner({ id: partner?.id, name, customPct: clamp(toNum(customPct), 0, 100), weaponsPct: clamp(toNum(weaponsPct), 0, 100), notes: notes.trim() })
      toast.success(partner ? 'Partenaire modifié.' : `${name.trim()} ajouté aux partenaires.`)
      onDone()
    } catch (err) {
      toast.error(`Base de données : ${(err as Error).message}`)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nom du partenaire *">
        <input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Saloon de Blackwater" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Remise personnalisation (%)" hint="Atelier : esthétique, lunettes, améliorations.">
          <input className="field" inputMode="decimal" value={customPct} onChange={(e) => setCustomPct(e.target.value)} />
        </Field>
        <Field label="Remise sur les armes (%)" hint="Revolvers, pistolets, carabines, fusils, lames.">
          <input className="field" inputMode="decimal" value={weaponsPct} onChange={(e) => setWeaponsPct(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Conditions, contact, durée du partenariat…" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

export default function Partenaires() {
  const { available, partners, deletePartner } = useExtras()
  const orders = useStore((s) => s.orders)
  const setCart = useStore((s) => s.setCart)
  const setTab = useUi((s) => s.setTab)
  const [editing, setEditing] = useState<Partner | 'new' | null>(null)
  const { ask, dialog } = useConfirm()

  const statsFor = (p: Partner) => {
    const list = orders.filter((o) => o.partnerName === p.name && o.status !== 'annulee')
    return { count: list.length, total: list.reduce((s, o) => s + o.total, 0), saved: list.reduce((s, o) => s + (o.partnerDiscount ?? 0), 0) }
  }

  async function remove(p: Partner) {
    if (!(await ask(`Retirer le partenaire « ${p.name} » ? Les ventes passées gardent leur remise.`))) return
    try {
      await deletePartner(p.id)
      toast('Partenaire retiré.')
    } catch (err) {
      toast.error(`Base de données : ${(err as Error).message}`)
    }
  }

  return (
    <Panel
      title="Partenaires"
      icon={<Handshake />}
      actions={
        available && (
          <Button variant="blood" onClick={() => setEditing('new')}>
            <Plus size={18} /> Nouveau partenaire
          </Button>
        )
      }
    >
      {available === false ? (
        <ExtrasUnavailable />
      ) : partners.length === 0 ? (
        <Empty icon={<Handshake size={34} />}>Aucun partenaire pour le moment.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((p) => {
            const st = statsFor(p)
            return (
              <article key={p.id} className="tile p-5 hover:translate-y-0">
                <header className="flex items-start justify-between gap-3">
                  <h3 className="font-western text-[28px] leading-none tracking-[.05em]">{p.name.toUpperCase()}</h3>
                  <div className="flex shrink-0">
                    <button className="cursor-pointer rounded-lg p-1.5 text-sepia hover:bg-white/10 hover:text-ink" onClick={() => setEditing(p)} aria-label="Modifier">
                      <Pencil size={16} />
                    </button>
                    <button className="cursor-pointer rounded-lg p-1.5 text-sepia hover:bg-white/10 hover:text-blood" onClick={() => remove(p)} aria-label="Retirer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </header>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Deal value={p.customPct} label="sur la personnalisation" />
                  <Deal value={p.weaponsPct} label="sur le prix des armes" />
                </div>
                {p.notes && <p className="mt-3 text-[15.5px] text-sepia italic">{p.notes}</p>}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <p className="text-[14.5px] text-sepia">
                    {st.count} vente(s) · {money(st.total)}
                    {st.saved > 0 && <span className="block text-brass">Remises accordées : {money(st.saved)}</span>}
                  </p>
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={() => {
                      setCart({ partnerId: p.id })
                      setTab('caisse')
                      toast(`Vente avec la remise ${p.name}`)
                    }}
                  >
                    <ShoppingCart size={14} /> Vendre
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nouveau partenaire' : 'Modifier le partenaire'}>
        {editing && <PartnerForm partner={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
      {dialog}
    </Panel>
  )
}

function Deal({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5">
      <p className="font-type text-4xl leading-none tracking-[.02em] text-brass">−{value} %</p>
      <p className="mt-1 text-[14px] text-sepia">{label}</p>
    </div>
  )
}
