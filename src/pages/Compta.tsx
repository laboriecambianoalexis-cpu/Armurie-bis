import { Calculator, Coins, Landmark, Percent, TrendingUp, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChartCard, HBars } from '@/components/compta/Charts'
import { Journal } from '@/components/compta/Journal'
import { Panel, Stat } from '@/components/ui'
import { useRachat } from '@/lib/rachat'
import { hasCostSheet, unitCost, useStock } from '@/lib/stock'
import { useStore } from '@/lib/store'
import { cn, money } from '@/lib/utils'
import { useStaff } from '@/lib/staff'
import { orderAllocation } from '@/lib/accounting'
import { useLedger } from '@/lib/ledger'

const PERIODS = [
  { id: 'jour', label: "Aujourd'hui", days: 1 },
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: 'tout', label: 'Tout', days: 0 },
] as const

export default function Compta() {
  const { orders, products } = useStore()
  const { staff, currentId } = useStaff()
  const materials = useStock((s) => s.materials)
  const buybacks = useRachat((s) => s.items)
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('7')

  const d = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)!.days
    const start = days ? new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * 86400000).getTime() : 0
    const sales = orders.filter((o) => (o.status === 'payee' || o.status === 'livree') && o.createdAt >= start)

    let revenue = 0
    let discounts = 0
    let cost = 0
    let shopRevenue = 0
    let shopCosts = 0
    let employeeShares = 0
    let estimated = false
    const byProduct = new Map<string, { name: string; qty: number; gross: number; cost: number; unknown: boolean }>()
    for (const o of sales) {
      revenue += o.total - o.tax
      discounts += o.discount
      for (const i of o.items) {
        const p = products.find((x) => x.id === i.productId)
        const c = i.cost ?? unitCost(p, materials) // anciennes ventes : coût estimé avec la fiche actuelle
        if (i.cost === undefined && hasCostSheet(p)) estimated = true
        cost += c * i.qty
        const row = byProduct.get(i.productId) ?? { name: i.name, qty: 0, gross: 0, cost: 0, unknown: !hasCostSheet(p) && !i.cost }
        row.qty += i.qty
        row.gross += i.price * i.qty
        row.cost += c * i.qty
        byProduct.set(i.productId, row)
      }
    }
    // reventes d'armes d'occasion : coût = prix de rachat
    const resales = buybacks.filter((b) => b.soldAt != null && b.soldAt >= start)
    let resaleProfit = 0
    for (const b of resales) {
      const sold = b.soldPrice ?? 0
      revenue += sold
      cost += b.buyPrice
      resaleProfit += sold - b.buyPrice
      const key = `occ-${b.productId ?? b.name}`
      const row = byProduct.get(key) ?? { name: `${b.name} (occasion)`, qty: 0, gross: 0, cost: 0, unknown: false }
      row.qty += 1
      row.gross += sold
      row.cost += b.buyPrice
      byProduct.set(key, row)
    }
    // ventes par vendeur (montant encaissé)
    const bySeller = new Map<string, number>()
    const byEmployee = new Map<string, { count: number; sales: number; personal: number; deposit: number }>()
    const addSeller = (name: string | null | undefined, v: number) => bySeller.set(name ?? 'Non renseigné', (bySeller.get(name ?? 'Non renseigné') ?? 0) + v)
    for (const o of sales) {
      addSeller(o.seller, o.total)
      const allocation = orderAllocation(o, products, materials)
      shopRevenue += allocation.shopRevenue
      shopCosts += allocation.shopCost
      employeeShares += allocation.sellerShare
      const row = byEmployee.get(o.seller ?? 'Non renseigné') ?? { count: 0, sales: 0, personal: 0, deposit: 0 }
      row.count += 1
      row.sales += o.total
      row.personal += allocation.sellerShare
      row.deposit += allocation.shopReceivable
      byEmployee.set(o.seller ?? 'Non renseigné', row)
    }
    for (const b of resales) addSeller(b.soldBy, b.soldPrice ?? 0)
    const sellers = [...bySeller].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    const profit = revenue - cost
    const rows = [...byProduct.values()].sort((a, b) => b.gross - b.cost - (a.gross - a.cost))
    return { sellers, byEmployee, resaleCount: resales.length, resaleProfit, count: sales.length, revenue, discounts, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0, rows, estimated, start, shopRevenue, shopCosts, employeeShares }
  }, [orders, products, materials, buybacks, period])

  // marge unitaire de chaque article ayant une fiche de fabrication
  const sheets = products
    .filter(hasCostSheet)
    .map((p) => {
      const c = unitCost(p, materials)
      return { p, c, m: p.price - c }
    })
    .sort((a, b) => b.m - a.m)
  const unknownSheets = products.filter((p) => !hasCostSheet(p) && p.category !== 'Personnalisation')
  const employee = staff.find((s) => s.id === currentId)
  const own = d.byEmployee.get(employee?.name ?? '') ?? { count: 0, sales: 0, personal: 0, deposit: 0 }
  const ownDeposit = d.byEmployee.get(employee?.name ?? '')?.deposit ?? 0
  const ledgerEntries = useLedger((s) => s.entries)
  const depositToLedger = useLedger((s) => s.deposit)
  const [depositBusy, setDepositBusy] = useState(false)
  const deposited = useMemo(() => ledgerEntries.filter((entry) => entry.kind === 'depot' && entry.author === employee?.name && entry.createdAt >= d.start).reduce((sum, entry) => sum + entry.amount, 0), [ledgerEntries, employee?.name, d.start])
  const ownOwed = Math.max(0, ownDeposit - deposited)
  const allEmployeesPersonal = d.employeeShares
  const shopNetProfit = d.shopRevenue - d.shopCosts
  const boutiqueTurnover = d.shopRevenue + allEmployeesPersonal

  return (
    <div className="space-y-5">
      <Journal />

      <h2 className="pt-3 font-western text-[30px] tracking-[.08em]">RENTABILITÉ</h2>
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              'label cursor-pointer rounded-full border px-4 py-1.5 text-[16px] transition',
              period === p.id ? 'border-blood bg-blood text-white shadow-[0_0_18px_-4px_rgba(208,27,37,.7)]' : 'border-white/10 text-sepia hover:bg-white/[.06] hover:text-ink',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Chiffre d'affaires" value={money(d.revenue)} sub={`${d.count} vente(s)${d.resaleCount ? ` + ${d.resaleCount} revente(s)` : ''} · remises ${money(d.discounts)}`} icon={<Coins size={24} />} />
        <Stat label="Coûts de fabrication" value={money(d.cost)} sub={d.resaleCount ? 'Taxes admin + matières + rachats' : 'Taxes admin + matières'} icon={<Landmark size={24} />} />
        <Stat label="Bénéfice net" value={money(d.profit)} sub={d.resaleCount ? `dont occasion ${money(d.resaleProfit)}` : d.estimated ? 'Certaines anciennes ventes estimées' : 'Ventes payées / livrées'} icon={<TrendingUp size={24} />} />
        <Stat label="Marge" value={`${d.margin.toFixed(1)} %`} sub="Bénéfice / chiffre d'affaires" icon={<Percent size={24} />} />
      </div>

      <Panel title={employee ? `Mon compte — ${employee.name}` : 'Compte vendeur'} icon={<Coins />}>
        {employee ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Ventes réalisées" value={String(own.count)} sub={`${money(own.sales)} encaissés côté client`} icon={<Coins size={22} />} />
            <Stat label="Gains personnels" value={money(own.personal)} sub="Commissions + atelier (100 %)" icon={<TrendingUp size={22} />} />
            <Stat label="À déposer en caisse" value={money(own.deposit)} sub="Part boutique, taxe comprise" icon={<Landmark size={22} />} />
            <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-white/[.03] p-4">
              <span className="label text-[14px] text-sepia">Déposé / restant dû</span>
              <strong className="mt-1 font-type text-2xl text-brass">{money(deposited)} / {money(ownOwed)}</strong>
              <button className="label mt-2 cursor-pointer self-start rounded-lg border border-brass/30 px-3 py-1 text-[14px] text-brass hover:bg-brass/10 disabled:opacity-50" disabled={!employee || ownOwed <= 0 || depositBusy} onClick={async () => {
                if (!employee || ownOwed <= 0) return
                setDepositBusy(true)
                try { await depositToLedger(employee.name, ownOwed); toast.success('Dépôt enregistré.') }
                catch (error) { toast.error((error as Error).message) }
                finally { setDepositBusy(false) }
              }}>Enregistrer le dépôt</button>
            </div>
          </div>
        ) : <p className="text-sepia">Sélectionne ton nom dans le menu Vendeur pour afficher ton relevé personnel.</p>}
      </Panel>
      <Panel title="Registre patron" icon={<Landmark />}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Chiffre d'affaires boutique" value={money(boutiqueTurnover)} sub="Chiffre d'affaires total (hors taxe client)" icon={<Coins size={22} />} />
          <Stat label="Bénéfice net boutique" value={money(shopNetProfit)} sub="Après coûts de fabrication et commissions" icon={<TrendingUp size={22} />} />
          <Stat label="Versé aux employés" value={money(allEmployeesPersonal)} sub="Parts vendeur sur la période" icon={<Wallet size={22} />} />
        </div>
      </Panel>

      <ChartCard title="Ventes par vendeur" subtitle="Montant encaissé sur la période">
        <HBars rows={d.sellers} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Articles les plus rentables" subtitle="Bénéfice sur la période">
          <HBars rows={d.rows.map((r) => ({ label: r.name, value: r.gross - r.cost }))} />
        </ChartCard>
        <ChartCard title="Meilleures marges unitaires" subtitle="Prix de vente − coût de fabrication">
          <HBars rows={sheets.map(({ p, m }) => ({ label: p.name, value: m }))} />
        </ChartCard>
      </div>

      <Panel title="Détail par article" icon={<Calculator />}>
        {d.rows.length === 0 ? (
          <p className="py-6 text-center text-sepia italic">Aucune vente sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger w-full min-w-[640px]">
              <thead>
                <tr>
                  <th>Article</th>
                  <th className="text-right!">Qté</th>
                  <th className="text-right!">Ventes</th>
                  <th className="text-right!">Coût</th>
                  <th className="text-right!">Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r) => (
                  <tr key={r.name}>
                    <td className="text-lg">
                      {r.name} {r.unknown && <span className="text-[13px] text-brass">· coût inconnu</span>}
                    </td>
                    <td className="text-right font-type text-[18px]">{r.qty}</td>
                    <td className="text-right font-type text-[18px]">{money(r.gross)}</td>
                    <td className="text-right font-type text-[18px] text-sepia">{money(r.cost)}</td>
                    <td className={cn('text-right font-type text-xl', r.gross - r.cost < 0 ? 'text-blood' : 'text-sage')}>{money(r.gross - r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.discounts > 0 && <p className="mt-2 text-right text-[14.5px] text-sepia">Les remises ({money(d.discounts)}) sont déduites du chiffre d'affaires global, pas des lignes.</p>}
          </div>
        )}
      </Panel>

      <Panel title="Marge par article (fiches de fabrication)" icon={<TrendingUp />}>
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[640px]">
            <thead>
              <tr>
                <th>Article</th>
                <th className="text-right!">Prix de vente</th>
                <th className="text-right!">Coût fabrication</th>
                <th className="text-right!">Marge unitaire</th>
                <th className="text-right!">%</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map(({ p, c, m }) => (
                <tr key={p.id}>
                  <td className="text-lg">{p.name}</td>
                  <td className="text-right font-type text-[18px]">{money(p.price)}</td>
                  <td className="text-right font-type text-[18px] text-sepia">{money(c)}</td>
                  <td className={cn('text-right font-type text-xl', m < 0 ? 'text-blood' : 'text-sage')}>{money(m)}</td>
                  <td className="text-right font-type text-[17px] text-sepia">{p.price ? ((m / p.price) * 100).toFixed(0) : 0} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {unknownSheets.length > 0 && (
          <p className="mt-3 text-[15px] text-brass">
            Sans fiche de fabrication (coût compté 0 $) : {unknownSheets.map((p) => p.name).join(', ')}. Ajoutez la taxe et la recette dans l'onglet Catalogue (crayon).
          </p>
        )}
        <p className="mt-2 text-[14.5px] text-sepia italic">Le coût des matières utilise le prix d'achat unitaire saisi dans l'onglet Stock (0 $ si non renseigné).</p>
      </Panel>
    </div>
  )
}
