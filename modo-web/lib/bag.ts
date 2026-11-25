"use client"

export interface StoredBagItem {
  id: string
  itemId: string
  title: string
  slug: string
  price: number
  image: string
  qty: number
  optionLabel?: string
  optionSku?: string
}

export interface StoredWishlistItem {
  itemId: string
  title: string
  slug: string
  price: number
  listPrice?: number
  image: string
  collectionTitle?: string
}

const BAG_KEY = "virga_bag"
const LEGACY_BAG_KEY = "modo_bag"
const PROMO_KEY = "virga_promo"
const WISHLIST_KEY = "virga_wishlist"

export const BAG_UPDATED_EVENT = "virga:bag-updated"
export const WISHLIST_UPDATED_EVENT = "virga:wishlist-updated"

function emit(name: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name))
  }
}

export function getStoredBag(): StoredBagItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(BAG_KEY) || localStorage.getItem(LEGACY_BAG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredBag(items: StoredBagItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(BAG_KEY, JSON.stringify(items))
    localStorage.removeItem(LEGACY_BAG_KEY)
    emit(BAG_UPDATED_EVENT)
  } catch {
    // ignore quota errors
  }
}

export function addToStoredBag(item: StoredBagItem): StoredBagItem[] {
  const bag = getStoredBag()
  const idx = bag.findIndex((b) => b.id === item.id)
  if (idx > -1) {
    bag[idx] = { ...bag[idx], qty: bag[idx].qty + item.qty }
  } else {
    bag.push(item)
  }
  saveStoredBag(bag)
  return bag
}

export function clearStoredBag() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(BAG_KEY)
    localStorage.removeItem(LEGACY_BAG_KEY)
    localStorage.removeItem(PROMO_KEY)
    emit(BAG_UPDATED_EVENT)
  } catch {
    // ignore
  }
}

export function getStoredPromo(): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem(PROMO_KEY) || ""
  } catch {
    return ""
  }
}

export function saveStoredPromo(code: string) {
  if (typeof window === "undefined") return
  try {
    if (code.trim()) {
      localStorage.setItem(PROMO_KEY, code.trim().toUpperCase())
    } else {
      localStorage.removeItem(PROMO_KEY)
    }
  } catch {
    // ignore
  }
}

export function getStoredWishlist(): StoredWishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredWishlist(items: StoredWishlistItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
    emit(WISHLIST_UPDATED_EVENT)
  } catch {
    // ignore
  }
}

export function toggleStoredWishlist(item: StoredWishlistItem): {
  items: StoredWishlistItem[]
  saved: boolean
} {
  const list = getStoredWishlist()
  const exists = list.some((w) => w.itemId === item.itemId)
  const updated = exists ? list.filter((w) => w.itemId !== item.itemId) : [item, ...list]
  saveStoredWishlist(updated)
  return { items: updated, saved: !exists }
}
