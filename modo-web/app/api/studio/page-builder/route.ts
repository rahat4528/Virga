import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import HomeLayout from "@/models/HomeLayout"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const SectionSchema = z.object({
  type: z.enum(["hero", "block", "collection-showcase", "journal-strip"]),
  referenceId: z
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid referenceId")
    .optional(),
  position: z.number().int().min(0),
  isVisible: z.boolean().default(true),
})

const UpdateLayoutSchema = z.object({
  sections: z.array(SectionSchema).min(1).max(30),
})

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    await dbConnect()
    const layout = await HomeLayout.findOne().sort({ modifiedAt: -1 }).lean()
    return okResponse({ item: layout })
  } catch (error) {
    console.error("GET /api/studio/page-builder error:", error)
    return failResponse("Failed to fetch home layout", "LAYOUT_FETCH_ERROR", 500)
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = UpdateLayoutSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid layout payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const normalized = parsed.data.sections.map((s, idx) => ({
      type: s.type,
      referenceId: s.referenceId ? new mongoose.Types.ObjectId(s.referenceId) : undefined,
      position: idx,
      isVisible: s.isVisible,
    }))

    const existing = await HomeLayout.findOne()
    const layout = existing
      ? await HomeLayout.findByIdAndUpdate(
          existing._id,
          { $set: { sections: normalized } },
          { new: true }
        )
      : await HomeLayout.create({ sections: normalized })

    return okResponse({ item: layout })
  } catch (error) {
    console.error("PUT /api/studio/page-builder error:", error)
    return failResponse("Failed to save home layout", "LAYOUT_SAVE_ERROR", 500)
  }
}
