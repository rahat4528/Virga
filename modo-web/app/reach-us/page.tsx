"use client"

import { useState } from "react"
import TopBar from "@/components/top-bar"
import SiteFooter from "@/components/site-footer"
import TrailNav from "@/components/trail-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Loader2 } from "lucide-react"

export default function ReachUsPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Please check your inquiry details and try again.")
        return
      }
      setIsSent(true)
      toast.success("Thank you. Our studio concierge will reply within 24 hours.")
    } catch {
      toast.error("Network error while sending inquiry")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 container-virga py-12 space-y-10 max-w-4xl">
        <TrailNav items={[{ label: "Reach Us" }]} />

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Concierge
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Connect with Our Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Whether inquiring about fiber specifications, custom tailoring, or an existing order, our team is at your disposal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Form */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm">
            {isSent ? (
              <div className="py-12 text-center space-y-3">
                <h3 className="font-heading text-lg font-bold text-foreground">Message Dispatched</h3>
                <p className="text-xs text-muted-foreground">We look forward to speaking with you shortly.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSent(false)
                    setMessage("")
                  }}
                  className="rounded-full text-xs"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Your Name</Label>
                  <Input
                    id="c-name"
                    required
                    disabled={isSubmitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email Address</Label>
                  <Input
                    id="c-email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-msg">Inquiry Details</Label>
                  <Textarea
                    id="c-msg"
                    required
                    minLength={10}
                    disabled={isSubmitting}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-xl min-h-28"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-full shadow-sm">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Dispatching…
                    </>
                  ) : (
                    "Send Inquiry"
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 pt-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold block text-foreground">Direct Concierge</span>
                <span className="text-muted-foreground">concierge@virga.store</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold block text-foreground">Phone Inquiries</span>
                <span className="text-muted-foreground">+1 (800) 555-VIRGA</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold block text-foreground">Atelier Flagship</span>
                <span className="text-muted-foreground">
                  45 Mercer Street<br />
                  SoHo, New York, NY 10013
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
