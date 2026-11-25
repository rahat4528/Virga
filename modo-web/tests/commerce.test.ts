import { describe, it, expect } from "vitest"
import {
  isSafeImageSource,
  evaluatePromoDiscount,
  computeOrderTotals,
  computeLoyaltySummary,
  parseCsvCatalogRows,
  sanitizeSpreadsheetText,
  isValidOrderTransition,
  aggregateMonthlyRevenue,
} from "../lib/commerce"
import { ItemGallerySchema } from "../types/item"
import { JournalEntrySchema } from "../types/journal"
import { CreateOrderSchema } from "../types/order"

describe("Virga Image & Schema Validation", () => {
  it("accepts safe local paths and HTTP(S) image sources while rejecting unsafe URIs", () => {
    expect(isSafeImageSource("/cashmere-cardigan.jpg")).toBe(true)
    expect(isSafeImageSource("https://res.cloudinary.com/demo/image/upload/coat.jpg")).toBe(true)
    expect(isSafeImageSource("//evil.example/payload.png")).toBe(false)
    expect(isSafeImageSource("/../../etc/passwd")).toBe(false)
    expect(isSafeImageSource("javascript:alert(1)")).toBe(false)
  })

  it("validates ItemGallerySchema and JournalEntrySchema with local public paths", () => {
    expect(
      ItemGallerySchema.safeParse({ src: "/tailored-wool-blazer.jpg", alt: "Blazer", isCover: true }).success
    ).toBe(true)
    expect(
      ItemGallerySchema.safeParse({ src: "javascript:alert(1)", alt: "XSS", isCover: true }).success
    ).toBe(false)
    expect(
      JournalEntrySchema.safeParse({
        title: "Biella Wool Weaving",
        excerpt: "Inside our northern Italian mill partnerships.",
        body: "Long-form story about weaving virgin wool in small batches.",
        coverImage: "/elegant-fashion-atelier.jpg",
      }).success
    ).toBe(true)
  })
})

describe("Virga Promo & Order Totals Engine", () => {
  it("evaluates active percentage and fixed promos with minSpend, caps, and expiry checks", () => {
    const now = new Date("2026-11-01T12:00:00Z")
    const pctPromo = {
      code: "VIRGA10",
      discountType: "percentage" as const,
      value: 10,
      minSpend: 100,
      isActive: true,
    }
    expect(evaluatePromoDiscount(pctPromo, 250, now)).toEqual({
      valid: true,
      code: "VIRGA10",
      discount: 25,
    })
    expect(evaluatePromoDiscount(pctPromo, 80, now).valid).toBe(false)

    const cappedPromo = {
      code: "VIP50",
      discountType: "percentage" as const,
      value: 50,
      maxDiscount: 75,
      isActive: true,
    }
    expect(evaluatePromoDiscount(cappedPromo, 400, now).discount).toBe(75)

    const expiredPromo = {
      code: "OLD20",
      discountType: "fixed" as const,
      value: 20,
      expiresAt: "2026-10-01T00:00:00Z",
      isActive: true,
    }
    expect(evaluatePromoDiscount(expiredPromo, 200, now).valid).toBe(false)
  })

  it("computes subtotal, discount, free shipping threshold, tax, and grand total", () => {
    const underThreshold = computeOrderTotals({ subtotal: 100, discount: 10 })
    expect(underThreshold).toEqual({
      subtotal: 100,
      discount: 10,
      shipping: 12,
      tax: 7.2,
      total: 109.2,
    })

    const overThreshold = computeOrderTotals({ subtotal: 200, discount: 20 })
    expect(overThreshold).toEqual({
      subtotal: 200,
      discount: 20,
      shipping: 0,
      tax: 14.4,
      total: 194.4,
    })
  })

  it("accepts optional shippingMethod and promoCode on CreateOrderSchema", () => {
    const res = CreateOrderSchema.safeParse({
      email: "client@example.com",
      lines: [{ itemId: "672000000000000000000001", qty: 1 }],
      shipTo: {
        fullName: "Sophia Chen",
        street: "740 Park Ave",
        city: "New York",
        postalCode: "10021",
        country: "US",
      },
      shippingMethod: "express",
      promoCode: "VIRGA10",
    })
    expect(res.success).toBe(true)
  })
})

describe("Virga Loyalty, CSV Import & State Transitions", () => {
  it("computes loyalty tiers and excludes cancelled/refunded orders", () => {
    const ember = computeLoyaltySummary([{ state: "paid", totals: { total: 240 } }])
    expect(ember.tier).toBe("Ember")
    expect(ember.points).toBe(240)
    expect(ember.pointsToNextTier).toBe(260)

    const clay = computeLoyaltySummary([
      { state: "delivered", totals: { total: 620 } },
      { state: "cancelled", totals: { total: 900 } },
    ])
    expect(clay.tier).toBe("Clay")
    expect(clay.points).toBe(620)
    expect(clay.qualifyingOrdersCount).toBe(1)

    const atelier = computeLoyaltySummary([{ state: "delivered", totals: { total: 1850 } }])
    expect(atelier.tier).toBe("Atelier")
    expect(atelier.nextTier).toBeNull()
  })

  it("parses CSV rows safely and neutralizes formula injection payloads", () => {
    expect(sanitizeSpreadsheetText('=HYPERLINK("http://evil.test")')).toBe(
      '\'=HYPERLINK("http://evil.test")'
    )

    const csv = [
      "title,price,listPrice,stock,collection,labels,imageUrl",
      "Silk Evening Dress,450,520,15,apparel,silk;evening,/silk-dress-detail-1.jpg",
      '"Cashmere Coat, Double-Faced",680,,8,outerwear,cashmere,/cashmere-cardigan.jpg',
      "Bad Row,-25,,5,apparel,test,/placeholder.jpg",
    ].join("\n")

    const { rows, errors } = parseCsvCatalogRows(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].labels).toEqual(["silk", "evening"])
    expect(rows[1].title).toBe("Cashmere Coat, Double-Faced")
    expect(errors).toHaveLength(1)
  })

  it("enforces order state machine transitions and monthly aggregation", () => {
    expect(isValidOrderTransition("pending", "paid")).toBe(true)
    expect(isValidOrderTransition("shipped", "delivered")).toBe(true)
    expect(isValidOrderTransition("cancelled", "shipped")).toBe(false)
    expect(isValidOrderTransition("refunded", "paid")).toBe(false)

    const now = new Date("2026-11-15T00:00:00Z")
    const series = aggregateMonthlyRevenue(
      [
        { addedAt: "2026-11-05T10:00:00Z", state: "paid", totals: { total: 320 } },
        { addedAt: "2026-11-08T10:00:00Z", state: "cancelled", totals: { total: 500 } },
        { addedAt: "2026-10-12T10:00:00Z", state: "delivered", totals: { total: 180 } },
      ],
      3,
      now
    )
    expect(series).toHaveLength(3)
    expect(series[1].revenue).toBe(180)
    expect(series[2].revenue).toBe(320)
    expect(series[2].orders).toBe(1)
  })
})
