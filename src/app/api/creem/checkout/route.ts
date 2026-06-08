import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// POST /api/creem/checkout - Create a Creem checkout session
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId, successUrl, cancelUrl } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    }

    // Create checkout session via Creem API
    const response = await fetch("https://api.creem.io/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey,
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl || `${process.env.AUTH_URL || "http://localhost:3000"}/dashboard?payment=success`,
        cancel_url: cancelUrl || `${process.env.AUTH_URL || "http://localhost:3000"}/pricing?payment=canceled`,
        metadata: {
          referenceId: session.user.id,
        },
        customer_email: session.user.email,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Failed to create Creem checkout", { error, productId });
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const checkout = await response.json();

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    });
  } catch (error) {
    logger.error("Creem checkout error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
