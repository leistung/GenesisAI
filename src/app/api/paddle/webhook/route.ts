import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

// Paddle Webhook Handler
// This endpoint receives webhooks from Paddle for payment events

// Verify Paddle webhook signature
async function verifyWebhookSignature(request: NextRequest, body: string): Promise<boolean> {
  const signature = request.headers.get("paddle-signature");
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.warn("Missing signature or webhook secret, skipping verification (development only)");
    return process.env.NODE_ENV === "development";
  }

  try {
    // Paddle uses HMAC-SHA256 for signature verification
    const hmac = createHmac("sha256", webhookSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    return signatureBuffer.length === expectedBuffer.length && 
           timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const { alert_name, alert_data } = body;

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(request, bodyText);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`Received Paddle webhook: ${alert_name}`);

    switch (alert_name) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionChange(alert_data);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(alert_data);
        break;

      case "transaction.completed":
        await handlePaymentSucceeded(alert_data);
        break;

      case "transaction.payment_failed":
        await handlePaymentFailed(alert_data);
        break;

      default:
        console.log(`Unhandled webhook event: ${alert_name}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleSubscriptionChange(data: Record<string, unknown>) {
  const { customer_id, subscription_id, plan_id, next_billed_at } = data;

  // Find user by Paddle customer ID
  const user = await prisma.user.findFirst({
    where: { paddleCustomerId: customer_id as string },
  });

  if (!user) {
    console.error(`User not found for Paddle customer: ${customer_id}`);
    return;
  }

  // Determine subscription tier from plan
  let tier = "premium";
  let credits = 2000;

  // You would look up the plan from your database
  const plan = await prisma.plan.findFirst({
    where: { paddlePriceId: plan_id as string },
  });

  if (plan) {
    tier = plan.name;
    credits = plan.credits;
  }

  // Update user subscription
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: tier,
      credits,
      paddleSubscriptionId: subscription_id as string,
    },
  });

  console.log(`Updated subscription for user ${user.id} to ${tier}`);
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  const { customer_id } = data;

  const user = await prisma.user.findFirst({
    where: { paddleCustomerId: customer_id as string },
  });

  if (!user) return;

  // Downgrade to free tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: "free",
      credits: 10,
      paddleSubscriptionId: null,
    },
  });

  console.log(`Cancelled subscription for user ${user.id}`);
}

async function handlePaymentSucceeded(data: Record<string, unknown>) {
  const { customer_id, order_id, transaction_id, amount, currency_code } = data;

  const user = await prisma.user.findFirst({
    where: { paddleCustomerId: customer_id as string },
  });

  if (!user) return;

  // Create order record
  await prisma.order.create({
    data: {
      userId: user.id,
      paddleOrderId: order_id as string,
      paddleTransactionId: transaction_id as string,
      status: "completed",
      amount: parseFloat(amount as string),
      currency: currency_code as string,
      creditsAdded: 0, // Credits added via subscription update
    },
  });

  console.log(`Payment succeeded for user ${user.id}: ${amount} ${currency_code}`);
}

async function handlePaymentFailed(data: Record<string, unknown>) {
  const { customer_id, order_id } = data;

  const user = await prisma.user.findFirst({
    where: { paddleCustomerId: customer_id as string },
  });

  if (!user) return;

  // Create failed order record
  await prisma.order.create({
    data: {
      userId: user.id,
      paddleOrderId: order_id as string,
      status: "failed",
      amount: 0,
      currency: "USD",
      creditsAdded: 0,
    },
  });

  console.log(`Payment failed for user ${user.id}, order: ${order_id}`);
}
