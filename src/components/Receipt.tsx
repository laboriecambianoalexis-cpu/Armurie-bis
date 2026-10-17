import { useStore } from '@/lib/store'
import type { Order } from '@/lib/types'
import { fmtDate, money, orderNo } from '@/lib/utils'
import { StatusStamp } from './ui'

export function Receipt({ order }: { order: Order }) {
  const settings = useStore((s) => s.settings)
  return (
    <div className="print-area relative mx-auto max-w-sm rounded-2xl bg-[#f4efe6] p-6 font-serif text-[#1a130d] shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]">
      <div className="text-center">
        <p className="font-western text-4xl leading-none tracking-[.06em]">{settings.shopName.toUpperCase()}</p>
        <p className="text-xs italic text-[#6b5e50]">{settings.town}</p>
        <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-[#d01b25] to-transparent" />
        <p className="text-sm">
          {orderNo(order.number)} — {fmtDate(order.createdAt)}
        </p>
        <p className="text-sm">Client : {order.clientName}</p>
        {order.seller && <p className="text-sm">Vendeur : {order.seller}</p>}
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {order.items.map((i) => (
            <tr key={i.productId} className="align-top">
              <td className="pr-2">
                {i.qty} × {i.name}
              </td>
              <td className="text-right whitespace-nowrap">{money(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 space-y-0.5 border-t border-dashed border-[#1a130d]/25 pt-2 text-sm">
        <Line label="Sous-total" value={money(order.subtotal)} />
        {!!order.partnerName && !!order.partnerDiscount && <Line label={`Partenaire ${order.partnerName}`} value={`− ${money(order.partnerDiscount)}`} />}
        {order.discount - (order.partnerDiscount ?? 0) > 0.004 && <Line label={`Remise ${order.discountPct}%`} value={`− ${money(order.discount - (order.partnerDiscount ?? 0))}`} />}
        {order.tax > 0 && <Line label={`Taxe ${order.taxPct}%`} value={`+ ${money(order.tax)}`} />}
        <div className="flex items-baseline justify-between border-t-2 border-double border-[#1a130d]/25 pt-1 font-western text-3xl tracking-[.04em]">
          <span>TOTAL</span>
          <span>{money(order.total)}</span>
        </div>
        {order.received > 0 && (
          <>
            <Line label="Reçu" value={money(order.received)} />
            <Line label="Monnaie rendue" value={money(order.change)} />
          </>
        )}
      </div>

      {order.note && <p className="mt-3 text-xs italic">Note : {order.note}</p>}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs italic text-[#6b5e50]">Merci, et bonne route.</p>
        <StatusStamp status={order.status} />
      </div>
    </div>
  )
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>{value}</span>
  </div>
)
