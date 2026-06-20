import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";
import { logger } from "@/lib/logger";

// GET /api/auth/verify-email?token=xxx - 验证邮箱
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required" },
      { status: 400 }
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.success) {
    logger.warn("Email verification failed", { error: result.error });
    // 重定向到登录页并带错误参数
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/signin?error=verification_failed&message=${encodeURIComponent(result.error || "")}`
    );
  }

  logger.info("Email verified, redirecting to signin", { email: result.email });
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${baseUrl}/signin?verified=true&email=${encodeURIComponent(result.email || "")}`
  );
}
