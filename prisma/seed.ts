import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed subscription plans
  const plans = [
    {
      name: "free",
      displayName: "Free",
      price: 0,
      currency: "USD",
      credits: 10,
      paddleProductId: null,
      paddlePriceId: null,
      features: JSON.stringify([
        "10 daily credits",
        "Standard quality",
        "Public images",
        "Basic styles",
      ]),
    },
    {
      name: "premium",
      displayName: "Premium",
      price: 9.99,
      currency: "USD",
      credits: 2000,
      paddleProductId: process.env.PADDLE_PREMIUM_PRODUCT_ID,
      paddlePriceId: process.env.PADDLE_PREMIUM_PRICE_ID,
      features: JSON.stringify([
        "2000 monthly credits",
        "High quality",
        "Private images",
        "All styles",
        "Priority support",
      ]),
    },
    {
      name: "ultimate",
      displayName: "Ultimate",
      price: 29.99,
      currency: "USD",
      credits: 10000,
      paddleProductId: process.env.PADDLE_ULTIMATE_PRODUCT_ID,
      paddlePriceId: process.env.PADDLE_ULTIMATE_PRICE_ID,
      features: JSON.stringify([
        "10000 monthly credits",
        "Ultra quality",
        "Private images",
        "All styles",
        "Priority support",
        "API access",
      ]),
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.plan.findFirst({
      where: { name: plan.name },
    });

    if (!existingPlan) {
      await prisma.plan.create({
        data: plan,
      });
      console.log(`Created plan: ${plan.displayName}`);
    } else {
      console.log(`Plan already exists: ${plan.displayName}`);
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
