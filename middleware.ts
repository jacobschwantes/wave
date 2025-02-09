import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// paths that don't require auth
const publicPaths = ["/"]

export async function middleware(request: NextRequest) {
  const session = await auth()
  const path = request.nextUrl.pathname
  const isPublicPath = publicPaths.includes(path)

  // skip middleware for root path
  if (path === "/") {
    return
  }

  // redirect to home if authenticated and trying to access public path
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // redirect to home if unauthenticated and trying to access protected path
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }
}

// configure which paths middleware runs on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|_static|[\\w-]+\\.\\w+).*)",
  ],
}
