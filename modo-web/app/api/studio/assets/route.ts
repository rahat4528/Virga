import { promises as fs } from "fs"
import path from "path"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"])

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

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

    files.sort((a, b) => a.name.localeCompare(b.name))
    return okResponse({ items: files })
  } catch (error) {
    console.error("GET /api/studio/assets error:", error)
    return failResponse("Failed to list assets", "ASSETS_LIST_ERROR", 500)
  }
}
