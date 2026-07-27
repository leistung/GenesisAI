import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// 校验 URL 是否为允许的同源地址，防止开放重定向钓鱼攻击
function isAllowedUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const allowedHost = new URL(baseUrl).host;
    return parsed.host === allowedHost;
  } catch {
    return false;
  }
}

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

    const creemApiBaseUrl = process.env.CREEM_API_BASE_URL || "https://api.creem.io";
    const isTestMode = creemApiBaseUrl.includes("test-api");
    const appBaseUrl = process.env.AUTH_URL || "http://localhost:3000";

    // 校验 successUrl/cancelUrl，仅允许同源地址
    const finalSuccessUrl = isAllowedUrl(successUrl)
      ? successUrl!
      : `${appBaseUrl}/dashboard?payment=success`;
    const finalCancelUrl = isAllowedUrl(cancelUrl)
      ? cancelUrl!
      : `${appBaseUrl}/pricing?payment=canceled`;

    // 测试模式 Creem API 不接受 cancel_url / customer_email
    const requestBody: Record<string, unknown> = {
      product_id: productId,
      success_url: finalSuccessUrl,
      metadata: {
        referenceId: session.user.id,
      },
    };
    if (!isTestMode) {
      requestBody.cancel_url = finalCancelUrl;
      requestBody.customer_email = session.user.email;
    }

    // Create checkout session via Creem API
    const response = await fetch(`${creemApiBaseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey,
      },
      body: JSON.stringify(requestBody),
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
