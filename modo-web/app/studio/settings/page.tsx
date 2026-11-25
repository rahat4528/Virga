import dbConnect from "@/lib/db"
import StoreSettings from "@/models/StoreSettings"
import { SettingsEditor, type StoreSettingsValues } from "@/components/studio/settings-editor"

export const dynamic = "force-dynamic"

export default async function StudioSettingsPage() {
  await dbConnect()
  const doc = await StoreSettings.findOne({ key: "default" }).lean()

  const initialValues: StoreSettingsValues = {
    storeName: doc?.storeName ?? "Virga",
    tagline: doc?.tagline ?? "Considered Fashion & Living",
    conciergeEmail: doc?.conciergeEmail ?? "concierge@virga.store",
    freeShippingThreshold: doc?.freeShippingThreshold ?? 150,
    standardShippingRate: doc?.standardShippingRate ?? 12,
    expressShippingRate: doc?.expressShippingRate ?? 25,
    taxRatePct: doc?.taxRatePct ?? 8,
    allowComplimentaryExchanges: doc?.allowComplimentaryExchanges ?? true,
    lowStockEmailAlerts: doc?.lowStockEmailAlerts ?? true,
    lowStockThreshold: doc?.lowStockThreshold ?? 5,
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Studio Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Store profile, currency, shipping zones, and integration policies.
        </p>
      </div>

      <SettingsEditor initialValues={initialValues} />
    </div>
  )
}
