import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserCredits, addCreditsToUser } from "@/lib/credits";

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
    console.error("Error fetching credits:", error);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}

// POST /api/credits/add - Add credits to user (admin/purchase use)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount = 1 } = await request.json();
    
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const result = await addCreditsToUser(session.user.id, amount);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding credits:", error);
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
  }
}
