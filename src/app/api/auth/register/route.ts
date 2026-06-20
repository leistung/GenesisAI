import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/email-verification";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 速率限制：防止批量注册攻击
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    logger.debug("[Register] received registration request", { body: { name: body.name, email: body.email } });

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      logger.warn("[Register] validation failed", { error: firstError.message });
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    logger.debug("[Register] validation passed", { name, email });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn("[Register] email already registered", { email });
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    logger.debug("[Register] hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);
    logger.debug("[Register] password hashed, creating user...");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 生成邮箱验证 token 并发送验证邮件
    // 即使邮件服务未配置，也会生成 token（开发环境可在日志中查看链接）
    const verification = await generateEmailVerificationToken(email);
    if (verification) {
      await sendVerificationEmail(email, verification.verificationUrl);
    }

    const duration = Date.now() - startTime;
    logger.debug("[Register] user created successfully", {
      userId: user.id,
      email: user.email,
      duration,
    });

    return NextResponse.json(
      {
        message: "Registration successful. Please check your email to verify your account.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("[Register] registration error", {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}
