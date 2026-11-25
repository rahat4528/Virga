import { NextRequest } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Subscriber from "@/models/Subscriber"
import { okResponse, failResponse } from "@/lib/api"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const NewsletterSchema = z.object({
  email: z.string().trim().email("Valid email address required").max(255).toLowerCase(),
  source: z.string().trim().max(40).default("footer"),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`newsletter:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.success) {
    return failResponse(
      `Please wait ${rl.retryAfterSeconds} seconds before subscribing again.`,
      "RATE_LIMITED",
      429
    )
  }

  try {
    const body = await req.json()
    const parsed = NewsletterSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid email address", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const subscriber = await Subscriber.findOneAndUpdate(
      { email: parsed.data.email },
      { $set: { isActive: true, source: parsed.data.source } },
      { new: true, upsert: true }
    )

    return okResponse({ item: { email: subscriber.email, isActive: subscriber.isActive } }, 201)
  } catch (error) {
    console.error("POST /api/newsletter error:", error)
    return failResponse("Failed to subscribe", "NEWSLETTER_ERROR", 500)
  }
}
