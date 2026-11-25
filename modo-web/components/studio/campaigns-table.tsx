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
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface CampaignRowData {
  _id: string
  subject: string
  audience: string
  state: "Draft" | "Scheduled" | "Sent"
  sentAt?: string
  openRate: string
  recipientCount?: number
}

export function CampaignsTable({ campaigns: initialCampaigns = [] }: { campaigns?: CampaignRowData[] }) {
  const [campaigns, setCampaigns] = useState<CampaignRowData[]>(initialCampaigns)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subject, setSubject] = useState("")
  const [audience, setAudience] = useState("All Clients")
  const [body, setBody] = useState("")

  async function handleCreateCampaign(e: React.FormEvent, publishState: "Draft" | "Sent") {
    e.preventDefault()
    if (!subject.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/studio/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          audience: audience.trim() || "All Clients",
          body: body.trim() || undefined,
          state: publishState,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to save campaign")
        return
      }
      setCampaigns((prev) => [data.item, ...prev])
      setIsOpen(false)
      setSubject("")
      setBody("")
      toast.success(
        publishState === "Sent" ? "Client dispatch queued & marked sent" : "Campaign draft saved"
      )
    } catch {
      toast.error("Network error while creating campaign")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMarkSent(id: string) {
    try {
      const res = await fetch("/api/studio/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, state: "Sent" }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error("Failed to dispatch campaign")
        return
      }
      setCampaigns((prev) => prev.map((c) => (c._id === id ? data.item : c)))
      toast.success("Campaign dispatched")
    } catch {
      toast.error("Network error while dispatching")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Client Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create Email Dispatch</DialogTitle>
              <DialogDescription className="text-xs">
                Draft or send a seasonal editorial dispatch to Virga clients.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => handleCreateCampaign(e, "Draft")} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="camp-subj" className="text-xs">Subject *</Label>
                <Input
                  id="camp-subj"
                  required
                  placeholder="Autumn / Winter 2026: The Tactile Series"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-aud" className="text-xs">Audience Segment</Label>
                <Input
                  id="camp-aud"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-body" className="text-xs">Dispatch Summary</Label>
                <Textarea
                  id="camp-body"
                  placeholder="Highlight seasonal pieces, atelier notes, and drop timing..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="rounded-xl min-h-24 text-xs"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="submit" variant="outline" disabled={isSubmitting} className="rounded-full text-xs">
                  Save Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting || !subject.trim()}
                  onClick={(e) => handleCreateCampaign(e, "Sent")}
                  className="rounded-full text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Publish Dispatch
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
              <TableHead>Dispatch Subject</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead className="text-right">State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  No email campaigns created yet.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium text-foreground">{c.subject}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.audience}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "Not sent yet"}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{c.openRate || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <Badge variant={c.state === "Sent" ? "default" : "outline"} className="rounded-full text-[10px]">
                        {c.state}
                      </Badge>
                      {c.state !== "Sent" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkSent(c._id)}
                          className="h-7 rounded-full text-xs text-primary"
                        >
                          Send
                        </Button>
                      )}
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

export default CampaignsTable
