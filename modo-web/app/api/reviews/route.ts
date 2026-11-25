import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Review from "@/models/Review"
import Item from "@/models/Item"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { okResponse, failResponse } from "@/lib/api"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const CreateReviewSchema = z.object({
  itemId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid item ID"),
  authorName: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(5, "Review must be at least 5 characters").max(1500),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return failResponse("Valid itemId is required", "INVALID_ID", 400)
    }

    await dbConnect()
    const reviews = await Review.find({ item: itemId, isApproved: true })
      .sort({ addedAt: -1 })
      .limit(50)
      .lean()

    return okResponse({ items: reviews })
  } catch (error) {
    console.error("GET /api/reviews error:", error)
    return failResponse("Failed to fetch reviews", "REVIEWS_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`review:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.success) {
    return failResponse(
      `Too many review submissions. Please wait ${rl.retryAfterSeconds} seconds.`,
      "RATE_LIMITED",
      429
    )
  }

  try {
    const body = await req.json()
    const parsed = CreateReviewSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid review input", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const itemExists = await Item.exists({ _id: parsed.data.itemId })
    if (!itemExists) {
      return failResponse("Item not found", "ITEM_NOT_FOUND", 404)
    }

    const session = await auth()
    let isVerifiedPurchase = false
    if (session?.user?.id) {
      const matchingOrder = await Order.exists({
        $or: [{ client: session.user.id }, { email: session.user.email?.toLowerCase() }],
        "lines.item": parsed.data.itemId,
        state: { $nin: ["cancelled", "refunded"] },
      })
      isVerifiedPurchase = Boolean(matchingOrder)
    }

    const review = await Review.create({
      item: parsed.data.itemId,
      client: session?.user?.id || undefined,
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      isVerifiedPurchase,
      isApproved: true,
    })

    // Recalculate ratingStats on Item
    const agg = await Review.aggregate([
      { $match: { item: new mongoose.Types.ObjectId(parsed.data.itemId), isApproved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
    ])
    const ratingStats = agg[0]
      ? { avg: Math.round(agg[0].avg * 10) / 10, total: agg[0].total }
      : { avg: parsed.data.rating, total: 1 }

    await Item.updateOne({ _id: parsed.data.itemId }, { $set: { ratingStats } })

    return okResponse({ item: review, ratingStats }, 201)
  } catch (error) {
    console.error("POST /api/reviews error:", error)
    return failResponse("Failed to submit review", "REVIEW_CREATE_ERROR", 500)
  }
}
