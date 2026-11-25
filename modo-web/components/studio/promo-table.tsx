"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface PromoRowData {
  _id: string
  code: string
  discountType: "percentage" | "fixed"
  value: number
  minSpend?: number
  usageCount: number
  isActive: boolean
}

interface PromoTableProps {
  promos?: PromoRowData[]
}

export function PromoTable({ promos: initialPromos = [] }: PromoTableProps) {
  const [promos, setPromos] = useState<PromoRowData[]>(initialPromos)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [value, setValue] = useState("10")
  const [minSpend, setMinSpend] = useState("0")

  async function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    try {
      const res = await fetch("/api/studio/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          value: Number(value),
          minSpend: Number(minSpend) || 0,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to create promo code")
        return
      }
      setPromos((prev) => [data.item, ...prev])
      setIsOpen(false)
      setCode("")
      toast.success(`Promo code ${data.item.code} created`)
    } catch {
      toast.error("Network error while creating promo code")
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleStatus(promo: PromoRowData) {
    try {
      const res = await fetch("/api/studio/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo._id, isActive: !promo.isActive }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error("Failed to toggle promo status")
        return
      }
      setPromos((prev) =>
        prev.map((p) => (p._id === promo._id ? { ...p, isActive: !promo.isActive } : p))
      )
      toast.success(`Promo ${promo.code} ${!promo.isActive ? "activated" : "paused"}`)
    } catch {
      toast.error("Network error while updating promo")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create Promo Code</DialogTitle>
              <DialogDescription className="text-xs">
                Add a live promotional discount code for storefront bag & checkout.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePromo} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="promo-code" className="text-xs">Code *</Label>
                <Input
                  id="promo-code"
                  required
                  placeholder="ATELIER15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="rounded-xl h-9 text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v === "fixed" ? "fixed" : "percentage")}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="promo-val" className="text-xs">Value *</Label>
                  <Input
                    id="promo-val"
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-min" className="text-xs">Minimum Spend ($)</Label>
                <Input
                  id="promo-min"
                  type="number"
                  min={0}
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={isCreating} className="rounded-full text-xs px-5">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Creating…
                    </>
                  ) : (
                    "Create Code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Benefit</TableHead>
              <TableHead>Min. Spend</TableHead>
              <TableHead>Redemptions</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  No active promotional codes.
                </TableCell>
              </TableRow>
            ) : (
              promos.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono font-bold text-foreground">
                    {p.code}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.discountType === "percentage" ? `${p.value}% Off` : `$${p.value} Flat Off`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.minSpend ? `$${p.minSpend}` : "None"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {p.usageCount} used
                  </TableCell>
                  <TableCell className="text-right">
                    <button type="button" onClick={() => toggleStatus(p)} className="cursor-pointer">
                      <Badge variant={p.isActive ? "default" : "secondary"} className="rounded-full text-[10px]">
                        {p.isActive ? "Active" : "Paused"}
                      </Badge>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default PromoTable
