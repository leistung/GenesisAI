import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserCredits, addCreditsToUser } from "@/lib/credits";
import { logger } from "@/lib/logger";

// GET /api/credits - Get user's current credits
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { credits, subscriptionTier } = await getUserCredits(session.user.id);
    return NextResponse.json({ credits, subscriptionTier });
  } catch (error) {
    logger.error("Error fetching credits", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}

// POST /api/credits - Add credits to user (admin only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can manually add credits
  // Regular credit additions happen via Creem webhook
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Only administrators can add credits manually" },
      { status: 403 }
    );
  }

  try {
    const { userId, amount } = await request.json();

    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid userId or amount" }, { status: 400 });
    }

    const result = await addCreditsToUser(userId, amount);
    logger.info("Credits added by admin", { adminId: session.user.id, userId, amount });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error adding credits", { error: String(error) });
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
  }
}
