import dbConnect from "@/lib/db"
import HomeLayout from "@/models/HomeLayout"
import { HomeBlock } from "@/models/Blocks"
import { PageBuilderEditor, type LayoutSectionRow } from "@/components/studio/page-builder-editor"

export const dynamic = "force-dynamic"

export default async function StudioPageBuilderPage() {
  await dbConnect()
  const [layoutDoc, blockDocs] = await Promise.all([
    HomeLayout.findOne().sort({ modifiedAt: -1 }).lean(),
    HomeBlock.find().sort({ position: 1 }).lean(),
  ])

  const blockNameMap = new Map(
    blockDocs.map((b: any) => [b._id.toString(), b.heading as string])
  )

  const initialSections: LayoutSectionRow[] =
    layoutDoc?.sections && layoutDoc.sections.length > 0
      ? layoutDoc.sections.map((s: any) => ({
          type: s.type,
          referenceId: s.referenceId ? s.referenceId.toString() : undefined,
          label:
            s.type === "hero"
              ? "Editorial Hero Banner"
              : s.type === "collection-showcase"
              ? "Collection Showcase"
              : s.type === "journal-strip"
              ? "Journal Dispatches Strip"
              : blockNameMap.get(s.referenceId?.toString() || "") || "Home Product Block",
          isVisible: Boolean(s.isVisible),
        }))
      : [
          { type: "hero", label: "Editorial Hero Banner", isVisible: true },
          { type: "collection-showcase", label: "Collection Showcase", isVisible: true },
          ...blockDocs.map((b: any) => ({
            type: "block" as const,
            referenceId: b._id.toString(),
            label: b.heading,
            isVisible: Boolean(b.isLive),
          })),
        ]

  const availableBlocks = blockDocs.map((b: any) => ({
    _id: b._id.toString(),
    heading: b.heading,
    kind: b.kind,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <PageBuilderEditor
        initialSections={initialSections}
        availableBlocks={availableBlocks}
      />
    </div>
  )
}
