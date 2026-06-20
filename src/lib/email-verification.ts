import { prisma } from "./db";
import { logger } from "./logger";
import crypto from "crypto";

// 邮箱验证 token 有效期（24 小时）
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

/**
 * 生成邮箱验证 token 并保存到数据库
 * 返回完整的验证链接（需配合邮件服务发送）
 */
export async function generateEmailVerificationToken(email: string): Promise<{
  token: string;
  verificationUrl: string;
} | null> {
  try {
    // 先清理该邮箱的旧 token
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    logger.info("Email verification token generated", { email });
    return { token, verificationUrl };
  } catch (error) {
    logger.error("Failed to generate email verification token", {
      error: String(error),
      email,
    });
    return null;
  }
}

/**
 * 验证邮箱 token 并标记用户为已验证
 */
export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired verification token" };
    }

    // 检查是否过期
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { success: false, error: "Verification token has expired" };
    }

    // 标记用户邮箱为已验证
    await prisma.user.updateMany({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // 删除已使用的 token
    await prisma.verificationToken.delete({
      where: { token },
    });

    logger.info("Email verified successfully", {
      email: verificationToken.identifier,
    });

    return { success: true, email: verificationToken.identifier };
  } catch (error) {
    logger.error("Email verification failed", { error: String(error) });
    return { success: false, error: "Verification failed" };
  }
}

/**
 * 检查用户邮箱是否已验证
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return !!user?.emailVerified;
}

/**
 * 发送验证邮件的占位函数
 * 实际项目中应接入 Resend / SendGrid / AWS SES 等邮件服务
 * 配置 SMTP_URL 或 RESEND_API_KEY 环境变量后启用
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
): Promise<boolean> {
  // 如果配置了 Resend API Key，使用 Resend 发送
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "GenesisAI <noreply@genesisai.com>",
          to: email,
          subject: "Verify your email - GenesisAI",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to GenesisAI!</h2>
              <p>Please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}"
                 style="display: inline-block; background: #7c3aed; color: white;
                        padding: 12px 24px; border-radius: 8px; text-decoration: none;
                        margin: 16px 0;">
                Verify Email
              </a>
              <p>Or copy this link to your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
              <p style="color: #6b7280; font-size: 12px;">
                This link expires in 24 hours. If you didn't create an account, ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        logger.error("Resend email send failed", {
          status: response.status,
          email,
        });
        return false;
      }

      logger.info("Verification email sent via Resend", { email });
      return true;
    } catch (error) {
      logger.error("Failed to send verification email", {
        error: String(error),
        email,
      });
      return false;
    }
  }

  // 未配置邮件服务时，仅记录日志（开发环境）
  logger.warn("Email service not configured, skipping verification email", {
    email,
    verificationUrl,
  });
  return false;
}
