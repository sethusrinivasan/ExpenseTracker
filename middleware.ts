import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const { pathname } = req.nextUrl

  const protectedRoutes = ["/dashboard", "/expenses"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !isLoggedIn) {
    const newUrl = new URL("/auth/signin", req.nextUrl.origin)
    return NextResponse.redirect(newUrl)
  }

  if (pathname === "/auth/signin" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
