import InsightFilters, { type ExportOrderSummary } from "@/components/studio/insight-filters"
import RevenueChart from "@/components/studio/revenue-chart"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { formatPrice } from "@/lib/cn"
import { aggregateMonthlyRevenue } from "@/lib/commerce"

interface InsightsPageProps {
  searchParams: Promise<{ range?: string; state?: string }>
}

export const dynamic = "force-dynamic"

export default async function StudioInsightsPage({ searchParams }: InsightsPageProps) {
  await dbConnect()
  const { range = "30d", state = "all" } = await searchParams

  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30
  const cutoff = new Date(Date.now() - days * 86400000)

  const query: Record<string, unknown> = { addedAt: { $gte: cutoff } }
  if (state && state !== "all") {
    query.state = state
  }

  const orders = await Order.find(query).sort({ addedAt: -1 }).lean()

  const validOrders = orders.filter((o) => o.state !== "cancelled" && o.state !== "refunded")
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0)
  const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0
  const chartData = aggregateMonthlyRevenue(orders)

  const exportRows: ExportOrderSummary[] = orders.map((o: any) => ({
    orderNo: o.orderNo,
    email: o.email,
    state: o.state,
    total: o.totals?.total || 0,
    addedAt: new Date(o.addedAt).toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Studio Insights & Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Detailed metrics covering sales velocity, average order values, and client cohort retention.
        </p>
      </div>

      <InsightFilters orders={exportRows} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Net Sales</span>
          <p className="font-heading text-2xl font-bold text-foreground">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Average Order Value</span>
          <p className="font-heading text-2xl font-bold text-foreground">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Matching Orders</span>
          <p className="font-heading text-2xl font-bold text-foreground">{orders.length} orders</p>
        </div>
      </div>

      <RevenueChart data={chartData} />
    </div>
  )
}
