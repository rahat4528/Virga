import Link from "next/link"
import TopBar from "@/components/top-bar"
import SiteFooter from "@/components/site-footer"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 container-virga py-24 flex flex-col items-center justify-center text-center space-y-5 max-w-lg">
        <span className="editorial-caps text-primary">404 · Not Found</span>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          This piece has moved or is no longer archived here.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Explore the current seasonal catalog, editorial journal, or return to the Virga homepage.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild className="rounded-full px-6 text-xs">
            <Link href="/shop">Explore Catalog</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 text-xs">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
