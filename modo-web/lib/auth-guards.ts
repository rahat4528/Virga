import { auth } from "@/auth"
import { failResponse } from "@/lib/api"
import { MANAGER_ROLES, STUDIO_ROLES } from "@/lib/commerce"

export interface StudioSession {
  userId: string
  name: string
  email: string
  role: string
}

export function isStudioRole(role?: string | null): boolean {
  return !!role && (STUDIO_ROLES as readonly string[]).includes(role)
}

export function isManagerRole(role?: string | null): boolean {
  return !!role && (MANAGER_ROLES as readonly string[]).includes(role)
}

export async function requireStudioAuth(requireManager = false) {
  const session = await auth()
  const role = session?.user?.role || "client"
  const allowed = requireManager ? isManagerRole(role) : isStudioRole(role)

  if (!session?.user?.id || !allowed) {
    return {
      ok: false as const,
      response: failResponse("Unauthorized", "UNAUTHORIZED", 401),
    }
  }

  return {
    ok: true as const,
    session: {
      userId: session.user.id,
      name: session.user.name || "Studio Staff",
      email: session.user.email || "",
      role,
    } satisfies StudioSession,
  }
}
