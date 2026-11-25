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
import { EXCHANGE_STATES } from "@/lib/commerce"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface ExchangeRow {
  _id: string
  exchangeNo: string
  orderNo: string
  clientName: string
  pieceTitle: string
  reason: string
  status: string
}

export function ExchangesManager({ initialExchanges }: { initialExchanges: ExchangeRow[] }) {
  const [exchanges, setExchanges] = useState<ExchangeRow[]>(initialExchanges)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [orderNo, setOrderNo] = useState("")
  const [clientName, setClientName] = useState("")
  const [pieceTitle, setPieceTitle] = useState("")
  const [reason, setReason] = useState("Fit adjustment")

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch("/api/studio/exchanges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to update exchange status")
        return
      }
      setExchanges((prev) => prev.map((ex) => (ex._id === id ? { ...ex, status } : ex)))
      toast.success(`Exchange updated to ${status}`)
    } catch {
      toast.error("Network error while updating exchange")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    try {
      const res = await fetch("/api/studio/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, clientName, pieceTitle, reason }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to log exchange")
        return
      }
      setExchanges((prev) => [data.item, ...prev])
      setIsOpen(false)
      setOrderNo("")
      setClientName("")
      setPieceTitle("")
      toast.success(`Exchange ${data.item.exchangeNo} logged`)
    } catch {
      toast.error("Network error while creating exchange")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Log Exchange Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Log Return / Exchange</DialogTitle>
              <DialogDescription className="text-xs">
                Record a client return or size exchange against an existing order.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ex-order" className="text-xs">Order Number *</Label>
                <Input
                  id="ex-order"
                  required
                  placeholder="VG-2026-891204"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-client" className="text-xs">Client Name *</Label>
                <Input
                  id="ex-client"
                  required
                  placeholder="Sophia Chen"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-piece" className="text-xs">Piece & Exchange Request *</Label>
                <Input
                  id="ex-piece"
                  required
                  placeholder="Relaxed Wool Blazer (Size S → M)"
                  value={pieceTitle}
                  onChange={(e) => setPieceTitle(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-reason" className="text-xs">Reason *</Label>
                <Input
                  id="ex-reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={isCreating} className="rounded-full text-xs px-5">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving…
                    </>
                  ) : (
                    "Create Request"
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
              <TableHead>Exchange ID</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Piece & Exchange Request</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exchanges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No return or exchange requests logged yet.
                </TableCell>
              </TableRow>
            ) : (
              exchanges.map((ex) => (
                <TableRow key={ex._id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {ex.exchangeNo}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {ex.orderNo}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{ex.clientName}</TableCell>
                  <TableCell className="text-sm text-foreground/90">{ex.pieceTitle}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ex.reason}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {ex.status}
                      </Badge>
                      <Select
                        value={ex.status}
                        disabled={updatingId === ex._id}
                        onValueChange={(val) => handleStatusChange(ex._id, val)}
                      >
                        <SelectTrigger className="w-36 h-8 rounded-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {EXCHANGE_STATES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
