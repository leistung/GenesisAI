import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/email-verification";
import { logger } from "@/lib/logger";

// POST /api/auth/resend-verification - 重新发送验证邮件
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    const verification = await generateEmailVerificationToken(user.email);
    if (!verification) {
      return NextResponse.json(
        { error: "Failed to generate verification token" },
        { status: 500 }
      );
    }

    const sent = await sendVerificationEmail(user.email, verification.verificationUrl);
    if (!sent) {
      logger.warn("Verification email not sent (mail service may not be configured)", {
        email: user.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    logger.error("Resend verification error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
