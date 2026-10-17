import { create } from 'zustand'

export type TabId = 'caisse' | 'partenaires' | 'commandes' | 'rachat' | 'clients' | 'catalogue' | 'stock' | 'compta' | 'guide' | 'crieur'

/** État d'interface partagé (onglet actif) — non sauvegardé. */
const TABS: TabId[] = ['caisse', 'partenaires', 'commandes', 'rachat', 'clients', 'catalogue', 'stock', 'compta', 'guide', 'crieur']
const fromHash = (): TabId => {
  const h = location.hash.slice(1) as TabId
  return TABS.includes(h) ? h : 'caisse'
}

/** Onglet actif, reflété dans l'adresse (#clients…) pour pouvoir le mettre en favori. */
export const useUi = create<{ tab: TabId; setTab: (t: TabId) => void }>((set) => ({
  tab: fromHash(),
  setTab: (tab) => {
    set({ tab })
    history.replaceState(null, '', tab === 'caisse' ? location.pathname + location.search : `#${tab}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
}))
