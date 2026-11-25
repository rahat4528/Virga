"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled storefront error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center space-y-5">
      <span className="editorial-caps text-primary">Temporary Interruption</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
        We encountered an unexpected issue loading this page.
      </h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Please try refreshing this view or return to the Virga storefront.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={reset} className="rounded-full px-6 text-xs">
          Try Again
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6 text-xs">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}
