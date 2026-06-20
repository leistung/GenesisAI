import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// 需要认证的路由
const protectedRoutes = ["/dashboard", "/settings"];

// 已登录用户应跳转走的路由
const authRoutes = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过 API 路由、静态文件、NextAuth 内部路由
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 使用 NextAuth auth() 验证会话有效性（而非仅检查 cookie 是否存在）
  // 这样可以正确处理过期、被撤销的 token
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  // 保护需要认证的路由
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 已登录用户访问认证页面时重定向到仪表盘
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
