import dbConnect from "@/lib/db"
import Exchange from "@/models/Exchange"
import { ExchangesManager, type ExchangeRow } from "@/components/studio/exchanges-manager"

export const dynamic = "force-dynamic"

export default async function StudioExchangesPage() {
  await dbConnect()
  const docs = await Exchange.find().sort({ addedAt: -1 }).lean()
  const exchanges: ExchangeRow[] = JSON.parse(JSON.stringify(docs))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Exchanges & Complimentary Returns
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review return requests, verify condition inspection, and process exchanges.
        </p>
      </div>

      <ExchangesManager initialExchanges={exchanges} />
    </div>
  )
}
