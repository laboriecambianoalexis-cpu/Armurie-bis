import { UserCheck, UserPlus, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useStaff } from '@/lib/staff'
import { cn } from '@/lib/utils'
import { Button } from './ui'

/** Sélecteur « qui vend sur ce PC » (en-tête). */
export function SellerPicker() {
  const { staff, currentId, setCurrent, available } = useStaff()
  if (!available) return <span />
  const active = staff.filter((s) => s.active)
  return (
    <label className={cn('flex items-center gap-2 rounded-xl border px-3 py-1.5 backdrop-blur-sm', currentId ? 'border-white/15 bg-black/40' : 'border-blood/70 bg-blood/25 shadow-[0_0_20px_-6px_rgba(208,27,37,.8)]')}>
      <UserCheck size={18} className={currentId ? 'text-brass' : 'text-blood'} />
      <span className="label text-[14px] text-sepia">Vendeur</span>
      <select
        className="cursor-pointer bg-transparent font-serif text-[17px] text-ink outline-none [&>option]:bg-[#17110d]"
        value={currentId ?? ''}
        onChange={(e) => setCurrent(e.target.value || null)}
        aria-label="Vendeur sur ce PC"
      >
        <option value="">— Choisir —</option>
        {active.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Gestion des employés (réglages ⚙). */
export function StaffSetting() {
  const { staff, add, setActive, available } = useStaff()
  const [name, setName] = useState('')
  if (!available) return null
  return (
    <>
      <p className="ornament pt-2 font-sc">Employés</p>
      <div className="flex flex-wrap gap-1.5">
        {staff.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id, !s.active).catch((e) => toast.error(e.message))}
            className={cn('flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[15px] transition', s.active ? 'border-white/15 hover:border-blood' : 'border-white/5 text-sepia-2 line-through')}
            title={s.active ? 'Cliquer pour retirer de la liste des vendeurs' : 'Cliquer pour réactiver'}
          >
            {s.active ? <UserCheck size={13} /> : <UserX size={13} />} {s.name}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          try {
            const s = await add(name)
            toast.success(`${s.name} ajouté aux employés.`)
            setName('')
          } catch (err) {
            toast.error((err as Error).message)
          }
        }}
      >
        <input className="field" placeholder="Nom & prénom de l'employé" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Button type="submit" variant="ink">
          <UserPlus size={16} /> Ajouter
        </Button>
      </form>
    </>
  )
}
