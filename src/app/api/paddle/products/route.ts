import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/paddle/products - Get available Paddle products/plans
export async function GET() {
  try {
    // In production, fetch from Paddle API
    // For now, return static plans that match our database
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    if (plans.length === 0) {
      // Seed default plans if not exist
      const defaultPlans = [
        {
          name: "free",
          displayName: "Free",
          price: 0,
          credits: 10,
          features: JSON.stringify([
            "10 credits per day",
            "Basic model only",
            "Community support",
            "Images include watermark",
          ]),
        },
        {
          name: "premium",
          displayName: "Premium",
          price: 9.99,
          credits: 2000,
          features: JSON.stringify([
            "2,000 credits per month",
            "All models included",
            "Priority queue",
            "No watermarks",
            "Fast AI Photo Editor",
          ]),
        },
        {
          name: "ultimate",
          displayName: "Ultimate",
          price: 19.99,
          credits: 5000,
          features: JSON.stringify([
            "5,000 credits per month",
            "All models included",
            "Highest priority queue",
            "No watermarks",
            "Instant AI Photo Editor",
            "Early access to new features",
          ]),
        },
      ];

      await prisma.plan.createMany({ data: defaultPlans });
      return NextResponse.json({ plans: defaultPlans });
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
