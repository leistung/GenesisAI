import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// POST /api/creem/portal - Create a Creem customer portal session
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    }

    // Get customer ID from user
    const user = await import("@/lib/db").then((m) =>
      m.prisma.user.findUnique({
        where: { id: session.user.id },
        select: { creemCustomerId: true },
      })
    );

    if (!user?.creemCustomerId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    // Create customer portal session via Creem API
    const response = await fetch("https://api.creem.io/v1/customers/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey,
      },
      body: JSON.stringify({
        customer_id: user.creemCustomerId,
        return_url: `${process.env.AUTH_URL || "http://localhost:3000"}/dashboard`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Failed to create Creem portal session", { error });
      return NextResponse.json(
        { error: "Failed to create portal session" },
        { status: 500 }
      );
    }

    const portal = await response.json();

    return NextResponse.json({
      portalUrl: portal.url,
    });
  } catch (error) {
    logger.error("Creem portal error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
