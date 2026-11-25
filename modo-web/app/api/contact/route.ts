import { NextRequest } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Inquiry from "@/models/Inquiry"
import { okResponse, failResponse } from "@/lib/api"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email address required").max(255),
  message: z.string().trim().min(10, "Please share at least 10 characters").max(3000),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.success) {
    return failResponse(
      `Too many inquiries sent. Please wait ${rl.retryAfterSeconds} seconds.`,
      "RATE_LIMITED",
      429
    )
  }

  try {
    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid inquiry fields", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const inquiry = await Inquiry.create(parsed.data)
    return okResponse({ item: { _id: inquiry._id, status: inquiry.status } }, 201)
  } catch (error) {
    console.error("POST /api/contact error:", error)
    return failResponse("Failed to submit inquiry", "CONTACT_ERROR", 500)
  }
}
