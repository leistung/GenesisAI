import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed demo account for development
  const demoEmail = "demo@genesisai.com";
  const demoPassword = "Demo@123456";
  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });
  if (!existingDemo) {
    const hashedPassword = await bcrypt.hash(demoPassword, 12);
    await prisma.user.create({
      data: {
        name: "Demo User",
        email: demoEmail,
        password: hashedPassword,
        role: "user",
        credits: 10,
      },
    });
    console.log(`Created demo account: ${demoEmail} / ${demoPassword}`);
  } else {
    console.log(`Demo account already exists: ${demoEmail}`);
  }

  // Seed subscription plans
  const plans = [
    {
      name: "free",
      displayName: "Free",
      price: 0,
      currency: "USD",
      credits: 10,
      creemProductId: null,
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
      creemProductId: process.env.CREEM_PREMIUM_PRODUCT_ID || null,
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
      price: 19.99,
      currency: "USD",
      credits: 5000,
      creemProductId: process.env.CREEM_ULTIMATE_PRODUCT_ID || null,
      features: JSON.stringify([
        "5000 monthly credits",
        "Ultra quality",
        "Private images",
        "All styles",
        "Priority support",
        "API access",
      ]),
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`Upserted plan: ${plan.displayName}`);
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
