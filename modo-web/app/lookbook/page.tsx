import TopBar from "@/components/top-bar"
import SiteFooter from "@/components/site-footer"
import TrailNav from "@/components/trail-nav"
import { LookbookShowcase, type LookView } from "@/components/lookbook-showcase"
import dbConnect from "@/lib/db"
import Look from "@/models/Look"

export const revalidate = 60

export default async function LookbookPage() {
  let looks: LookView[] = []
  try {
    await dbConnect()
    const lookDocs = await Look.find({ state: "published" })
      .populate("hotspots.itemId", "title slug price gallery")
      .sort({ publishedAt: -1 })
      .lean()
    looks = JSON.parse(JSON.stringify(lookDocs)) as LookView[]
  } catch (error) {
    console.warn("MongoDB offline during LookbookPage prerender:", error)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 container-virga py-10 sm:py-14 space-y-12">
        <TrailNav items={[{ label: "Lookbook" }]} />

        {/* Lookbook Header */}
        <div className="space-y-3 max-w-2xl pb-4 border-b border-border/70">
          <span className="editorial-caps text-primary">Seasonal Wardrobe Ensembles</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Shoppable Lookbook
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed font-light">
            Silhouettes styled in natural daylight. Explore each look to inspect individual garment tailoring, fabric textures, and drape.
          </p>
        </div>

        <LookbookShowcase looks={looks} />
      </main>
      <SiteFooter />
    </div>
  )
}
