import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { customFetch } from "@auth/core";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;

// 缓存代理相关的 Node-only 模块，避免每次 OAuth 请求都重复加载
let proxyModules: {
  fetch: typeof import("node-fetch").default;
  HttpsProxyAgent: typeof import("https-proxy-agent").HttpsProxyAgent;
} | null = null;

async function getProxyModules() {
  if (proxyModules) return proxyModules;
  const [{ default: nodeFetch }, { HttpsProxyAgent }] = await Promise.all([
    import("node-fetch"),
    import("https-proxy-agent"),
  ]);
  proxyModules = { fetch: nodeFetch, HttpsProxyAgent };
  return proxyModules;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function proxyFetch(url: any, init?: any): Promise<Response> {
  if (proxyUrl) {
    const { fetch, HttpsProxyAgent } = await getProxyModules();
    const agent = new HttpsProxyAgent(proxyUrl);
    return (await fetch(url, { ...init, agent })) as unknown as Response;
  }
  // 没有代理时直接用全局 fetch（Edge/Node 都支持）
  return globalThis.fetch(url, init);
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleConfigured =
  !!googleClientId &&
  !!googleClientSecret &&
  googleClientId !== "dummy" &&
  googleClientSecret !== "dummy";

// Provider 配置数组
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      logger.debug("[Auth] authorize called", { email: credentials?.email });

      if (!credentials?.email || !credentials?.password) {
        logger.debug("[Auth] missing email or password");
        return null;
      }

      try {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          logger.debug("[Auth] user not found or no password", { email: credentials.email as string });
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          logger.debug("[Auth] incorrect password", { email: credentials.email as string });
          return null;
        }

        logger.debug("[Auth] login validation successful", { userId: user.id, email: user.email });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          credits: user.credits,
          subscriptionTier: user.subscriptionTier,
          creemCustomerId: user.creemCustomerId,
          role: user.role,
        };
      } catch (error) {
        logger.error("[Auth] database error during credentials login", {
          email: credentials.email as string,
          error: error instanceof Error ? error.message : String(error),
        });
        // 返回 null 让前端显示 CredentialsSignin，避免抛出 Configuration 错误
        return null;
      }
    },
  }),
];

// 仅在配置真实 Google OAuth 时才启用 Google 登录
// 避免在本地开发使用 dummy 值时触发 NextAuth Configuration 错误
if (isGoogleConfigured) {
  providers.unshift(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // 显式配置 endpoints，避免运行时 fetch Google well-known 配置
      // 注意：callback 阶段仍需访问 oauth2.googleapis.com 交换 token
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      checks: ["pkce", "state"],
      // 中国大陆开发环境：如果配置了 HTTPS_PROXY，OAuth 请求走代理
      [customFetch]: proxyFetch,
      // 首次登录时 PrismaAdapter 会自动创建 user + account
      allowDangerousEmailAccountLinking: false,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      // 仅对 Google OAuth 做额外处理
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) {
          logger.warn("[Auth] Google sign-in rejected: no email");
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // 如果该邮箱已存在且只有密码账号，允许 Google 登录并自动关联
          // Google OAuth 邮箱默认已验证
          logger.info("[Auth] Google sign-in for existing user", {
            userId: existingUser.id,
            email,
          });
        } else {
          logger.info("[Auth] Google sign-in creating new user", { email });
        }
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? "";
        token.credits = user.credits;
        token.subscriptionTier = user.subscriptionTier;
        token.creemCustomerId = user.creemCustomerId;
        token.role = user.role;
      }

      // Refresh user data from DB when session is updated
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.credits = dbUser.credits;
          token.subscriptionTier = dbUser.subscriptionTier;
          token.creemCustomerId = dbUser.creemCustomerId;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.credits = token.credits as number;
        session.user.subscriptionTier = token.subscriptionTier as string | null;
        session.user.creemCustomerId = token.creemCustomerId as string | null;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info("[Auth] signIn event", {
        provider: account?.provider,
        userId: user.id,
        email: user.email,
        isNewUser,
      });

      // 新用户通过 Google 登录时，如果 credits 为 0，补充默认免费积分
      if (isNewUser && account?.provider === "google" && user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });
        if (dbUser && dbUser.credits === 0) {
          const freePlan = await prisma.plan.findUnique({
            where: { name: "free" },
          });
          if (freePlan && freePlan.credits > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { credits: freePlan.credits },
            });
            logger.info("[Auth] Granted free credits to new Google user", {
              userId: user.id,
              credits: freePlan.credits,
            });
          }
        }
      }
    },
  },
});

declare module "next-auth" {
  interface User {
    credits: number;
    subscriptionTier: string | null;
    creemCustomerId: string | null;
    role: string;
  }
  interface Session {
    user: User;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    credits: number;
    subscriptionTier: string | null;
    creemCustomerId: string | null;
    role: string;
  }
}
