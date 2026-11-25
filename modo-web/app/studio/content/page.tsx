import { promises as fs } from "fs"
import path from "path"
import dbConnect from "@/lib/db"
import { HeroBanner, HomeBlock } from "@/models/Blocks"
import JournalEntry from "@/models/JournalEntry"
import AssetLibrary from "@/components/studio/asset-library"
import ArticlesTable from "@/components/studio/articles-table"
import PagesTable from "@/components/studio/pages-table"
import {
  HomeBlocksManager,
  HeroBannerEditor,
  QuickJournalForm,
  type StudioHomeBlockRow,
  type StudioHeroBannerState,
} from "@/components/studio/content-cms-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"])

async function readLocalAssets() {
  try {
    const publicDir = path.join(process.cwd(), "public")
    const entries = await fs.readdir(publicDir, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
        .map(async (e) => {
          const stat = await fs.stat(path.join(publicDir, e.name))
          const kb = Math.max(1, Math.round(stat.size / 1024))
          return {
            id: e.name,
            src: `/${e.name}`,
            name: e.name,
            size: kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
          }
        })
    )
    return files.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export default async function StudioContentPage() {
  await dbConnect()

  const [banner, blockDocs, articleDocs, localAssets] = await Promise.all([
    HeroBanner.findOne({ isLive: true }).lean(),
    HomeBlock.find().sort({ position: 1 }).lean(),
    JournalEntry.find().sort({ publishedAt: -1 }).lean(),
    readLocalAssets(),
  ])

  const articles = JSON.parse(JSON.stringify(articleDocs))
  const blocks: StudioHomeBlockRow[] = blockDocs.map((b: any) => ({
    _id: b._id.toString(),
    heading: b.heading,
    slug: b.slug,
    kind: b.kind,
    pickingMode: b.picking?.mode || "auto",
    layout: b.display?.layout || "grid",
    columns: b.display?.columns || 4,
    isLive: Boolean(b.isLive),
  }))

  const heroState: StudioHeroBannerState = {
    headline: banner?.headline || "Form, Function & Purpose",
    subline:
      banner?.subline ||
      "An exploration of sculptural silhouettes, unbleached linen, and double-faced virgin wool.",
    backdrop: banner?.backdrop || "/elegant-fashion-model-in-minimalist-setting.jpg",
    primaryLabel: banner?.primaryCta?.label || "Explore Collection",
    primaryHref: banner?.primaryCta?.href || "/shop",
    secondaryLabel: banner?.secondaryCta?.label || "Atelier Story",
    secondaryHref: banner?.secondaryCta?.href || "/story",
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Content & Editorial CMS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Curate homepage hero banner, dynamic home blocks, editorial journal dispatches, and media assets.
        </p>
      </div>

      <Tabs defaultValue="blocks" className="space-y-6">
        <TabsList className="rounded-2xl p-1 bg-muted">
          <TabsTrigger value="blocks" className="rounded-xl text-xs">Home Blocks</TabsTrigger>
          <TabsTrigger value="hero" className="rounded-xl text-xs">Hero Banner</TabsTrigger>
          <TabsTrigger value="journal" className="rounded-xl text-xs">Journal Articles</TabsTrigger>
          <TabsTrigger value="assets" className="rounded-xl text-xs">Asset Library</TabsTrigger>
          <TabsTrigger value="pages" className="rounded-xl text-xs">Site Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          <HomeBlocksManager initialBlocks={blocks} />
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <HeroBannerEditor initialBanner={heroState} />
        </TabsContent>

        <TabsContent value="journal" className="space-y-6">
          <QuickJournalForm />
          <ArticlesTable articles={articles} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <AssetLibrary initialAssets={localAssets} />
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <PagesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
