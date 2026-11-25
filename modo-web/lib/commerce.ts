export const STUDIO_ROLES = ["staff", "manager", "owner", "admin"] as const
export const MANAGER_ROLES = ["manager", "owner", "admin"] as const

export const ORDER_STATES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export type OrderState = (typeof ORDER_STATES)[number]

export const EXCHANGE_STATES = [
  "Requested",
  "Pending Inspection",
  "Approved",
  "Completed",
  "Declined",
] as const

export type ExchangeState = (typeof EXCHANGE_STATES)[number]

/**
 * Validates image paths and URLs, permitting safe local `/...` paths and HTTP(S) URLs
 * while rejecting protocol-relative URLs, traversal segments, and script schemes.
 */
export function isSafeImageSource(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.includes("..") && !/[\s<>]/.test(trimmed)
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export interface PromoLike {
  code: string
  discountType: "percentage" | "fixed"
  value: number
  minSpend?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount?: number
  startsAt?: Date | string | null
  expiresAt?: Date | string | null
  isActive: boolean
}

export interface PromoValidationResult {
  valid: boolean
  code: string
  discount: number
  reason?: string
}

export function evaluatePromoDiscount(
  promo: PromoLike | null | undefined,
  subtotal: number,
  now = new Date()
): PromoValidationResult {
  if (!promo) {
    return { valid: false, code: "", discount: 0, reason: "Promo code not found" }
  }
  const code = promo.code.trim().toUpperCase()
  if (!promo.isActive) {
    return { valid: false, code, discount: 0, reason: "This promo code is currently inactive" }
  }
  if (promo.startsAt && new Date(promo.startsAt) > now) {
    return { valid: false, code, discount: 0, reason: "This promo code is not active yet" }
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < now) {
    return { valid: false, code, discount: 0, reason: "This promo code has expired" }
  }
  if (
    typeof promo.usageLimit === "number" &&
    promo.usageLimit > 0 &&
    (promo.usageCount || 0) >= promo.usageLimit
  ) {
    return { valid: false, code, discount: 0, reason: "This promo code has reached its redemption limit" }
  }
  if (typeof promo.minSpend === "number" && subtotal < promo.minSpend) {
    return {
      valid: false,
      code,
      discount: 0,
      reason: `Minimum spend of $${promo.minSpend.toFixed(2)} required for ${code}`,
    }
  }

  let discount =
    promo.discountType === "percentage"
      ? (subtotal * promo.value) / 100
      : promo.value

  if (typeof promo.maxDiscount === "number" && promo.maxDiscount > 0) {
    discount = Math.min(discount, promo.maxDiscount)
  }

  discount = Math.round(Math.min(subtotal, Math.max(0, discount)) * 100) / 100
  return { valid: true, code, discount }
}

export interface OrderTotalsInput {
  subtotal: number
  discount?: number
  freeShippingThreshold?: number
  standardShippingRate?: number
  taxRate?: number
}

export interface OrderTotalsResult {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export function computeOrderTotals({
  subtotal,
  discount = 0,
  freeShippingThreshold = 150,
  standardShippingRate = 12,
  taxRate = 0.08,
}: OrderTotalsInput): OrderTotalsResult {
  const safeSubtotal = Math.round(Math.max(0, subtotal) * 100) / 100
  const safeDiscount = Math.round(Math.min(safeSubtotal, Math.max(0, discount)) * 100) / 100
  const discountedSubtotal = Math.max(0, safeSubtotal - safeDiscount)
  const shipping =
    safeSubtotal === 0 || safeSubtotal >= freeShippingThreshold ? 0 : standardShippingRate
  const tax = Math.round(discountedSubtotal * taxRate * 100) / 100
  const total = Math.round((discountedSubtotal + shipping + tax) * 100) / 100

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    shipping,
    tax,
    total,
  }
}

export type LoyaltyTier = "Ember" | "Clay" | "Atelier"

export interface LoyaltySummary {
  points: number
  tier: LoyaltyTier
  nextTier: LoyaltyTier | null
  pointsToNextTier: number
  progressPct: number
  qualifyingSpend: number
  qualifyingOrdersCount: number
}

export function computeLoyaltySummary(
  orders: Array<{ state?: string; totals?: { total?: number } }>
): LoyaltySummary {
  const qualifying = orders.filter(
    (ord) => ord.state !== "cancelled" && ord.state !== "refunded"
  )
  const qualifyingSpend = qualifying.reduce(
    (sum, ord) => sum + Math.max(0, ord.totals?.total || 0),
    0
  )
  const points = Math.round(qualifyingSpend)

  let tier: LoyaltyTier = "Ember"
  let nextTier: LoyaltyTier | null = "Clay"
  let pointsToNextTier = Math.max(0, 500 - points)
  let progressPct = Math.min(100, Math.round((points / 500) * 100))

  if (points >= 1500) {
    tier = "Atelier"
    nextTier = null
    pointsToNextTier = 0
    progressPct = 100
  } else if (points >= 500) {
    tier = "Clay"
    nextTier = "Atelier"
    pointsToNextTier = Math.max(0, 1500 - points)
    progressPct = Math.min(100, Math.round(((points - 500) / 1000) * 100))
  }

  return {
    points,
    tier,
    nextTier,
    pointsToNextTier,
    progressPct,
    qualifyingSpend: Math.round(qualifyingSpend * 100) / 100,
    qualifyingOrdersCount: qualifying.length,
  }
}

/**
 * Neutralizes leading formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect against CSV formula injection.
 */
export function sanitizeSpreadsheetText(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`
  }
  return trimmed
}

export interface ParsedCsvCatalogRow {
  rowNumber: number
  title: string
  price: number
  listPrice?: number
  stock: number
  collectionSlug?: string
  labels: string[]
  imageUrl: string
  summary?: string
  description: string
}

export interface CsvParseResult {
  rows: ParsedCsvCatalogRow[]
  errors: Array<{ rowNumber: number; message: string }>
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

export function parseCsvCatalogRows(csvText: string): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, message: "CSV input is empty" }] }
  }

  const firstCells = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const hasHeader = firstCells.includes("title") && firstCells.includes("price")
  const headers = hasHeader
    ? firstCells
    : ["title", "price", "listprice", "stock", "collection", "labels", "imageurl"]
  const startIdx = hasHeader ? 1 : 0

  const rows: ParsedCsvCatalogRow[] = []
  const errors: Array<{ rowNumber: number; message: string }> = []

  const maxRows = 200
  const sliceEnd = Math.min(lines.length, startIdx + maxRows)

  for (let i = startIdx; i < sliceEnd; i++) {
    const rowNumber = i + 1
    const cells = splitCsvLine(lines[i])
    const get = (col: string) => {
      const idx = headers.indexOf(col)
      return idx >= 0 ? (cells[idx] ?? "").trim() : ""
    }

    const rawTitle = sanitizeSpreadsheetText(get("title"))
    const priceNum = Number(get("price"))
    const listPriceRaw = get("listprice") || get("list_price")
    const listPriceNum = listPriceRaw ? Number(listPriceRaw) : undefined
    const stockRaw = get("stock")
    const stockNum = stockRaw ? Math.max(0, Math.floor(Number(stockRaw))) : 0
    const collectionSlug = get("collection") || undefined
    const labelsRaw = get("labels")
    const imageRaw = get("imageurl") || get("image") || "/placeholder.jpg"
    const summary = sanitizeSpreadsheetText(get("summary") || "")
    const descriptionRaw = sanitizeSpreadsheetText(get("description") || "")

    if (!rawTitle || rawTitle.length < 2) {
      errors.push({ rowNumber, message: "Title must be at least 2 characters" })
      continue
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      errors.push({ rowNumber, message: "Price must be a valid non-negative number" })
      continue
    }
    if (listPriceNum !== undefined && (!Number.isFinite(listPriceNum) || listPriceNum < 0)) {
      errors.push({ rowNumber, message: "List price must be a valid non-negative number" })
      continue
    }
    if (!Number.isFinite(stockNum)) {
      errors.push({ rowNumber, message: "Stock must be a valid integer" })
      continue
    }
    if (!isSafeImageSource(imageRaw)) {
      errors.push({ rowNumber, message: "Image URL/path is invalid or unsafe" })
      continue
    }

    const labels = labelsRaw
      ? labelsRaw
          .split(/[;|]/)
          .map((l) => sanitizeSpreadsheetText(l))
          .filter(Boolean)
      : []

    rows.push({
      rowNumber,
      title: rawTitle,
      price: Math.round(priceNum * 100) / 100,
      listPrice: listPriceNum !== undefined ? Math.round(listPriceNum * 100) / 100 : undefined,
      stock: stockNum,
      collectionSlug,
      labels,
      imageUrl: imageRaw,
      summary: summary || `${rawTitle} from the Virga seasonal archive.`,
      description:
        descriptionRaw && descriptionRaw.length >= 10
          ? descriptionRaw
          : `${rawTitle} crafted with natural fibers and enduring atelier tailoring for Virga.`,
    })
  }

  if (lines.length > sliceEnd) {
    errors.push({
      rowNumber: sliceEnd + 1,
      message: `Batch capped at ${maxRows} rows per import`,
    })
  }

  return { rows, errors }
}

const VALID_ORDER_TRANSITIONS: Record<OrderState, OrderState[]> = {
  pending: ["paid", "packed", "cancelled"],
  paid: ["packed", "shipped", "cancelled", "refunded"],
  packed: ["shipped", "delivered", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
}

export function isValidOrderTransition(current: string, next: string): boolean {
  if (current === next) return true
  const allowed = VALID_ORDER_TRANSITIONS[current as OrderState]
  if (!allowed) return false
  return allowed.includes(next as OrderState)
}

export interface MonthlyRevenuePoint {
  month: string
  revenue: number
  orders: number
}

export function aggregateMonthlyRevenue(
  orders: Array<{ addedAt?: Date | string; totals?: { total?: number }; state?: string }>,
  monthsCount = 6,
  now = new Date()
): MonthlyRevenuePoint[] {
  const buckets: Array<{ key: string; label: string; revenue: number; orders: number }> = []
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" })

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    buckets.push({
      key,
      label: formatter.format(d),
      revenue: 0,
      orders: 0,
    })
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]))
  for (const ord of orders) {
    if (ord.state === "cancelled" || ord.state === "refunded") continue
    if (!ord.addedAt) continue
    const d = new Date(ord.addedAt)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const target = bucketMap.get(key)
    if (target) {
      target.revenue = Math.round((target.revenue + (ord.totals?.total || 0)) * 100) / 100
      target.orders += 1
    }
  }

  return buckets.map(({ label, revenue, orders: count }) => ({
    month: label,
    revenue,
    orders: count,
  }))
}
