import TopBar from "@/components/top-bar"
import SiteFooter from "@/components/site-footer"
import HeroBanner from "@/components/hero-banner"
import HomeBlocks from "@/components/home-blocks"
import CollectionShowcase from "@/components/collection-showcase"
import dbConnect from "@/lib/db"
import { HeroBanner as HeroBannerModel, HomeBlock } from "@/models/Blocks"
import HomeLayout from "@/models/HomeLayout"
import Collection from "@/models/Collection"
import Item from "@/models/Item"
import type { HeroBannerDto, HomeBlockDto } from "@/types/home-blocks"

export const revalidate = 60 // ISR revalidation

async function getHomeData() {
  try {
    await dbConnect()

    const [bannerDoc, blockDocs, collectionDocs, layoutDoc] = await Promise.all([
      HeroBannerModel.findOne({ isLive: true }).lean(),
      HomeBlock.find({ isLive: true }).sort({ position: 1 }).lean(),
      Collection.find({ isVisible: true, parent: null }).sort({ position: 1 }).limit(4).lean(),
      HomeLayout.findOne().sort({ modifiedAt: -1 }).lean(),
    ])

    const enrichedBlocks = await Promise.all(
      blockDocs.map(async (block) => {
        let items: unknown[] = []

        if (block.picking.mode === "manual" && block.picking.itemIds?.length) {
          const fetchedItems = await Item.find({
            _id: { $in: block.picking.itemIds },
            state: "live",
          })
            .populate("collection", "title slug")
            .lean({ virtuals: true })

          const itemMap = new Map(fetchedItems.map((item) => [item._id.toString(), item]))
          items = block.picking.itemIds
            .map((id) => itemMap.get(id.toString()))
            .filter(Boolean)
        } else {
          const rules = block.picking.rules
          const query: Record<string, unknown> = { state: "live" }

          if (rules?.collection) query.collection = rules.collection
          if (rules?.labels && rules.labels.length) query.labels = { $in: rules.labels }

          let sortObj: Record<string, 1 | -1> = { addedAt: -1 }
          switch (rules?.sort) {
            case "price-asc":
              sortObj = { price: 1 }
              break
            case "price-desc":
              sortObj = { price: -1 }
              break
            case "top-rated":
              sortObj = { "ratingStats.avg": -1 }
              break
            case "best-selling":
              sortObj = { "salesStats.units": -1 }
              break
            default:
              sortObj = { addedAt: -1 }
          }

          items = await Item.find(query)
            .populate("collection", "title slug")
            .sort(sortObj)
            .limit(rules?.limit || 4)
            .lean({ virtuals: true })
        }

        return JSON.parse(JSON.stringify({ ...block, items }))
      })
    )

    const banner = bannerDoc ? (JSON.parse(JSON.stringify(bannerDoc)) as HeroBannerDto) : null
    const collections = JSON.parse(JSON.stringify(collectionDocs))
    const layoutSections = layoutDoc?.sections
      ? JSON.parse(JSON.stringify(layoutDoc.sections))
      : null

    return {
      banner,
      blocks: enrichedBlocks as HomeBlockDto[],
      collections,
      layoutSections,
    }
  } catch {
    console.warn("MongoDB offline during build prerendering; returning initial empty dataset.")
    return {
      banner: null,
      blocks: [],
      collections: [],
      layoutSections: null,
    }
  }
}

export default async function HomePage() {
  const { banner, blocks, collections, layoutSections } = await getHomeData()

  const blockMap = new Map(blocks.map((b) => [b._id, b]))
  const hasCustomLayout = Array.isArray(layoutSections) && layoutSections.length > 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1">
        {hasCustomLayout ? (
          layoutSections
            .filter((s: { isVisible: boolean }) => s.isVisible)
            .map((sec: { type: string; referenceId?: string }, idx: number) => {
              if (sec.type === "hero") {
                return <HeroBanner key={`hero-${idx}`} initialBanner={banner} />
              }
              if (sec.type === "collection-showcase") {
                return <CollectionShowcase key={`col-${idx}`} collections={collections} />
              }
              if (sec.type === "block") {
                const matched = sec.referenceId ? blockMap.get(sec.referenceId) : undefined
                if (matched) {
                  return <HomeBlocks key={`block-${matched._id}-${idx}`} blocks={[matched]} />
                }
              }
              return null
            })
        ) : (
          <>
            <HeroBanner initialBanner={banner} />
            <CollectionShowcase collections={collections} />
            <HomeBlocks blocks={blocks} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
