import dbConnect from "@/lib/db"
import Item from "@/models/Item"
import { StockTable, type StockRowItem } from "@/components/studio/stock-table"

export const dynamic = "force-dynamic"

export default async function StudioStockPage() {
  await dbConnect()

  const itemDocs = await Item.find().sort({ stock: 1 }).lean()
  const items: StockRowItem[] = itemDocs.map((it: any) => ({
    _id: it._id.toString(),
    title: it.title,
    price: it.price,
    stock: it.stock,
    optionsCount: it.options?.length || 0,
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Stock & Inventory Levels
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor SKU units, low-stock alerts, and warehouse reserves.
        </p>
      </div>

      <StockTable initialItems={items} />
    </div>
  )
}
