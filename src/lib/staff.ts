import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hasDb, supabase } from './db'
import { normName, uid } from './utils'

/* ——— Employés / vendeurs ———
 * La liste est partagée (Supabase) ; le vendeur « connecté » est propre à chaque PC (localStorage).
 * Chaque vente enregistre le nom du vendeur.
 */

export interface Staff {
  id: string
  name: string
  active: boolean
}

const TABLE = 'armurerie_staff'

interface StaffState {
  available: boolean | null
  staff: Staff[]
  /** id du vendeur qui utilise ce PC */
  currentId: string | null
  setCurrent: (id: string | null) => void
  load: () => Promise<void>
  add: (name: string) => Promise<Staff>
  setActive: (id: string, active: boolean) => Promise<void>
}

export const useStaff = create<StaffState>()(
  persist(
    (set, get) => ({
      available: !supabase,
      staff: [],
      currentId: null,
      setCurrent: (currentId) => set({ currentId }),
      load: async () => {
        if (!supabase) {
          set({ available: true })
          return
        }
        const { data, error } = await supabase.from(TABLE).select('*').order('name')
        if (error) {
          set({ available: false })
          return
        }
        const staff = (data ?? []).map((r: any) => ({ id: r.id, name: r.name, active: r.active }) as Staff) // eslint-disable-line @typescript-eslint/no-explicit-any
        // le vendeur choisi a été retiré / désactivé → on le déselectionne
        const cur = get().currentId
        set({ available: true, staff, currentId: staff.some((s) => s.id === cur && s.active) ? cur : null })
      },
      add: async (raw) => {
        const name = raw.trim().replace(/\s+/g, ' ')
        const twin = get().staff.find((s) => normName(s.name) === normName(name))
        if (twin) {
          if (!twin.active) await get().setActive(twin.id, true)
          return twin
        }
        const s: Staff = { id: uid(), name, active: true }
        if (supabase) {
          const { error } = await supabase.from(TABLE).insert({ id: s.id, name })
          if (error) throw new Error(error.message)
        }
        set((st) => ({ staff: [...st.staff, s].sort((a, b) => a.name.localeCompare(b.name, 'fr')) }))
        return s
      },
      setActive: async (id, active) => {
        if (supabase) {
          const { error } = await supabase.from(TABLE).update({ active }).eq('id', id)
          if (error) throw new Error(error.message)
        }
        set((st) => ({ staff: st.staff.map((s) => (s.id === id ? { ...s, active } : s)), currentId: !active && st.currentId === id ? null : st.currentId }))
      },
    }),
    { name: 'armurerie-vendeur', partialize: (s) => hasDb ? { currentId: s.currentId } : { staff: s.staff, currentId: s.currentId } },
  ),
)

/** Nom de l'employé qui vend sur ce PC (ou null). */
export const currentSellerName = () => {
  const s = useStaff.getState()
  return s.staff.find((x) => x.id === s.currentId)?.name ?? null
}

/** Identifiant de l'employé qui vend sur ce PC (ou null). */
export const currentSellerId = () => useStaff.getState().currentId

export function subscribeStaff(onChange: () => void) {
  if (!supabase) return () => {}
  const ch = supabase.channel('armurerie-staff').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange).subscribe()
  return () => {
    supabase!.removeChannel(ch)
  }
}
