import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
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
