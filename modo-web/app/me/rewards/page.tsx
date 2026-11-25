import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Award, Sparkles } from "lucide-react"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { computeLoyaltySummary } from "@/lib/commerce"
import { formatPrice } from "@/lib/cn"

export const dynamic = "force-dynamic"

export default async function MeRewardsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/me/rewards")
  }

  await dbConnect()
  const orders = await Order.find({
    $or: [{ client: session.user.id }, { email: session.user.email?.toLowerCase() }],
  })
    .sort({ addedAt: -1 })
    .lean()

  const summary = computeLoyaltySummary(orders)

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border/60">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Virga Rewards & Tiers
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Earn 1 Atelier Point per $1 spent across all considered wardrobe and living orders.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Current Tier
              </span>
              <h3 className="font-heading text-xl font-bold text-foreground">
                {summary.tier} Member
              </h3>
            </div>
          </div>

          {summary.nextTier ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{summary.pointsToNextTier} pts</span>{" "}
              until <span className="font-semibold text-foreground">{summary.nextTier}</span> tier
            </p>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Highest Tier Unlocked
            </span>
          )}
        </div>

        {/* Tier progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500 rounded-full"
              style={{ width: `${summary.progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>Ember (0+)</span>
            <span>Clay (500+)</span>
            <span>Atelier (1,500+)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
            <span className="text-xs text-muted-foreground block">Available Points</span>
            <span className="font-heading text-xl font-bold text-foreground">
              {summary.points.toLocaleString()} pts
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
            <span className="text-xs text-muted-foreground block">Complimentary Shipping</span>
            <span className="font-heading text-sm font-semibold text-foreground">
              {summary.tier === "Ember" ? "Orders Over $150" : "Always Included"}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
            <span className="text-xs text-muted-foreground block">Qualifying Spend</span>
            <span className="font-heading text-sm font-semibold text-secondary">
              {formatPrice(summary.qualifyingSpend)} ({summary.qualifyingOrdersCount} orders)
            </span>
          </div>
        </div>
      </div>

      {/* Points ledger derived from orders */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <h2 className="font-heading text-base font-bold text-foreground">Recent Points Activity</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No orders yet.{" "}
            <Link href="/shop" className="text-primary hover:underline font-medium">
              Explore the collection
            </Link>{" "}
            to begin earning rewards.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {orders.slice(0, 6).map((ord: any) => {
              const cancelled = ord.state === "cancelled" || ord.state === "refunded"
              const earned = cancelled ? 0 : Math.round(ord.totals?.total || 0)
              return (
                <div key={ord._id.toString()} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <Link href={`/track/${ord.orderNo}`} className="font-mono font-semibold text-foreground hover:text-primary">
                      {ord.orderNo}
                    </Link>
                    <p className="text-muted-foreground">
                      {new Date(ord.addedAt).toLocaleDateString()} · <span className="capitalize">{ord.state}</span>
                    </p>
                  </div>
                  <span className={`font-semibold ${cancelled ? "text-muted-foreground line-through" : "text-secondary"}`}>
                    +{earned} pts
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
