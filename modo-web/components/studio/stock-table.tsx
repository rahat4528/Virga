"use client"

import { useState } from "react"
import { formatPrice } from "@/lib/cn"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export interface StockRowItem {
  _id: string
  title: string
  price: number
  stock: number
  optionsCount: number
}

export function StockTable({ initialItems }: { initialItems: StockRowItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [draftStock, setDraftStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialItems.map((i) => [i._id, i.stock]))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  async function saveStock(itemId: string, nextStock: number) {
    const clamped = Math.max(0, Math.floor(nextStock))
    setSavingId(itemId)
    try {
      const res = await fetch("/api/studio/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, stock: clamped }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to update stock")
        return
      }
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, stock: clamped } : item))
      )
      setDraftStock((prev) => ({ ...prev, [itemId]: clamped }))
      toast.success("Inventory level updated")
    } catch {
      toast.error("Network error while updating stock")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Piece</TableHead>
            <TableHead>SKU Options</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Units in Stock</TableHead>
            <TableHead>Inventory Health</TableHead>
            <TableHead className="text-right">Adjust</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                No pieces found in inventory.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const isLowStock = item.stock > 0 && item.stock <= 5
              const isOut = item.stock <= 0
              const val = draftStock[item._id] ?? item.stock

              return (
                <TableRow key={item._id}>
                  <TableCell className="font-semibold text-foreground text-sm">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.optionsCount > 0 ? `${item.optionsCount} SKUs defined` : "Standard SKU"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatPrice(item.price)}
                  </TableCell>
                  <TableCell className="font-bold text-sm">{item.stock} units</TableCell>
                  <TableCell>
                    <Badge
                      variant={isOut ? "destructive" : isLowStock ? "secondary" : "outline"}
                      className="rounded-full text-[10px]"
                    >
                      {isOut ? "Depleted" : isLowStock ? "Low Stock Alert" : "Healthy"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) =>
                          setDraftStock((prev) => ({
                            ...prev,
                            [item._id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-20 h-8 rounded-lg text-xs text-right font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingId === item._id || val === item.stock}
                        onClick={() => saveStock(item._id, val)}
                        className="h-8 rounded-full text-xs px-3"
                      >
                        {savingId === item._id ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
