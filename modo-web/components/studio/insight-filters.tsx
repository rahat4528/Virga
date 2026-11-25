"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { sanitizeSpreadsheetText } from "@/lib/commerce"

export interface ExportOrderSummary {
  orderNo: string
  email: string
  state: string
  total: number
  addedAt: string
}

export function InsightFilters({ orders = [] }: { orders?: ExportOrderSummary[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get("range") || "30d"
  const currentState = searchParams.get("state") || "all"

  function updateParam(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val === "all" && key === "state") {
      params.delete(key)
    } else {
      params.set(key, val)
    }
    router.push(`/studio/insights?${params.toString()}`)
  }

  function handleExportCsv() {
    const header = "orderNo,email,state,total,addedAt"
    const lines = orders.map((o) =>
      [
        sanitizeSpreadsheetText(o.orderNo),
        sanitizeSpreadsheetText(o.email),
        sanitizeSpreadsheetText(o.state),
        o.total.toFixed(2),
        new Date(o.addedAt).toISOString(),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [header, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `virga-insights-${currentRange}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Select value={currentRange} onValueChange={(v) => updateParam("range", v)}>
          <SelectTrigger className="w-36 rounded-full text-xs">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl text-xs">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last quarter</SelectItem>
            <SelectItem value="1y">Trailing year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentState} onValueChange={(v) => updateParam("state", v)}>
          <SelectTrigger className="w-40 rounded-full text-xs">
            <SelectValue placeholder="Order state" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl text-xs">
            <SelectItem value="all">All Order States</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        className="rounded-full text-xs w-full sm:w-auto"
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Export CSV ({orders.length})
      </Button>
    </div>
  )
}

export default InsightFilters
