import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

// Creem Webhook Handler
// Handles payment events from Creem (https://creem.io)

// Verify Creem webhook signature (HMAC-SHA256)
function verifyCreemSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("Missing CREEM_WEBHOOK_SECRET, skipping verification (development only)");
    return process.env.NODE_ENV === "development";
  }

  try {
    const hmac = createHmac("sha256", webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    return (
      signatureBuffer.length === expectedBuffer.length &&
      timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  } catch (error) {
    logger.error("Creem signature verification error", { error: String(error) });
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const { eventType, object } = body;

    // Verify webhook signature
    const signature = request.headers.get("creem-signature") || "";
    const isValid = verifyCreemSignature(bodyText, signature);
    if (!isValid) {
      logger.error("Invalid Creem webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    logger.info("Creem webhook received", { eventType });

    switch (eventType) {
      case "checkout.completed":
        await handleCheckoutCompleted(object);
        break;

      case "subscription.active":
        await handleSubscriptionActive(object);
        break;

      case "subscription.paid":
        await handleSubscriptionPaid(object);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(object);
        break;

      case "subscription.scheduled_cancel":
        await handleSubscriptionScheduledCancel(object);
        break;

      case "subscription.past_due":
        await handleSubscriptionPastDue(object);
        break;

      case "subscription.expired":
        await handleSubscriptionExpired(object);
        break;

      case "refund.created":
        await handleRefundCreated(object);
        break;

      default:
        logger.info("Unhandled Creem webhook event", { eventType });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Creem webhook processing error", { error: String(error) });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Handle checkout.completed - one-time payment or initial subscription checkout
async function handleCheckoutCompleted(data: Record<string, unknown>) {
  const order = data.order as Record<string, unknown> | undefined;
  const customer = data.customer as Record<string, unknown> | undefined;
  const product = data.product as Record<string, unknown> | undefined;
  const subscription = data.subscription as Record<string, unknown> | undefined;
  const metadata = (data.metadata || order?.metadata) as Record<string, unknown> | undefined;

  if (!customer || !order) return;

  const customerEmail = customer.email as string;
  const customerId = customer.id as string;

  // Find user by email or by metadata referenceId
  const referenceId = metadata?.referenceId as string | undefined;
  let user = referenceId
    ? await prisma.user.findUnique({ where: { id: referenceId } })
    : await prisma.user.findUnique({ where: { email: customerEmail } });

  if (!user) {
    logger.warn("User not found for Creem checkout", { customerEmail, customerId });
    return;
  }

  // Update user's Creem customer ID
  await prisma.user.update({
    where: { id: user.id },
    data: { creemCustomerId: customerId },
  });

  // Create order record
  await prisma.order.create({
    data: {
      userId: user.id,
      creemOrderId: order.id as string,
      creemTransactionId: (order as Record<string, unknown>).transaction_id as string | undefined,
      status: "completed",
      amount: ((order.amount as number) / 100), // Creem amounts are in cents
      currency: ((order.currency as string) || "USD").toUpperCase(),
      creditsAdded: 0,
    },
  });

  // If this is a one-time payment (not subscription), add credits based on product
  if (!subscription && product) {
    const productId = product.id as string;
    const plan = await prisma.plan.findFirst({
      where: { creemProductId: productId },
    });

    if (plan) {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: plan.credits } },
      });

      // Update order with credits added
      await prisma.order.update({
        where: { creemOrderId: order.id as string },
        data: { creditsAdded: plan.credits },
      });
    }
  }

  logger.info("Creem checkout completed", { userId: user.id, orderId: order.id as string });
}

// Handle subscription.active - new subscription created
async function handleSubscriptionActive(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  const product = data.product as Record<string, unknown> | undefined;

  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  // Skip if subscription is already active (avoid double-processing with checkout.completed)
  if (user.creemSubscriptionId === (data.id as string)) {
    logger.info("Subscription already active, skipping", { userId: user.id, subscriptionId: data.id as string });
    return;
  }

  let tier = "premium";
  let credits = 2000;

  if (product) {
    const plan = await prisma.plan.findFirst({
      where: { creemProductId: product.id as string },
    });
    if (plan) {
      tier = plan.name;
      credits = plan.credits;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: tier,
      credits,
      creemSubscriptionId: data.id as string,
    },
  });

  logger.info("Creem subscription activated", { userId: user.id, tier });
}

// Handle subscription.paid - recurring payment succeeded
async function handleSubscriptionPaid(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  const product = data.product as Record<string, unknown> | undefined;

  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  // Refresh credits for the billing period
  let credits = 2000;
  if (product) {
    const plan = await prisma.plan.findFirst({
      where: { creemProductId: product.id as string },
    });
    if (plan) credits = plan.credits;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { credits },
  });

  // Create order record for the payment
  await prisma.order.create({
    data: {
      userId: user.id,
      creemOrderId: `sub_${data.id}_paid_${Date.now()}`,
      status: "completed",
      amount: product ? (product.price as number) / 100 : 0,
      currency: product ? ((product.currency as string) || "USD").toUpperCase() : "USD",
      creditsAdded: credits,
    },
  });

  logger.info("Creem subscription paid", { userId: user.id });
}

// Handle subscription.canceled
async function handleSubscriptionCanceled(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: "free",
      credits: 10,
      creemSubscriptionId: null,
    },
  });

  logger.info("Creem subscription canceled", { userId: user.id });
}

// Handle subscription.scheduled_cancel
async function handleSubscriptionScheduledCancel(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) {
    logger.info("Creem subscription scheduled cancel - user not found", { customerId: customer.id as string });
    return;
  }

  logger.info("Creem subscription scheduled for cancel", { userId: user.id });
  // Keep subscription active until current_period_end_date
}

// Handle subscription.past_due
async function handleSubscriptionPastDue(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  logger.warn("Creem subscription past due", { userId: user.id });
  // Optionally notify user or restrict access
}

// Handle subscription.expired
async function handleSubscriptionExpired(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: "free",
      credits: 10,
      creemSubscriptionId: null,
    },
  });

  logger.info("Creem subscription expired", { userId: user.id });
}

// Handle refund.created
async function handleRefundCreated(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer) return;

  const user = await prisma.user.findFirst({
    where: { creemCustomerId: customer.id as string },
  });

  if (!user) return;

  logger.info("Creem refund created", { userId: user.id });
  // Optionally deduct credits or adjust subscription
}
