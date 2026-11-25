"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Virga Studio error:", error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-card border border-border text-center space-y-4">
      <span className="editorial-caps text-primary">Virga Studio</span>
      <h2 className="font-heading text-2xl font-bold text-foreground">
        Unable to load this workspace view
      </h2>
      <p className="text-xs text-muted-foreground">
        Verify your database connection and permissions, then retry.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Button onClick={reset} size="sm" className="rounded-full text-xs">
          Retry
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
          <Link href="/studio">Studio Overview</Link>
        </Button>
      </div>
    </div>
  )
}
