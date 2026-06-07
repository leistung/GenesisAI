import { prisma } from "./db";

// Free tier daily credits
export const FREE_DAILY_CREDITS = 10;

// Check if user has enough credits and handle daily reset
export async function checkAndConsumeCredits(
  userId: string,
  creditsToConsume: number = 1
): Promise<{
  success: boolean;
  error?: string;
  remainingCredits: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      subscriptionTier: true,
      creditsResetAt: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found", remainingCredits: 0 };
  }

  // Premium/Ultimate users have unlimited credits
  if (user.subscriptionTier && user.subscriptionTier !== "free") {
    return { success: true, remainingCredits: Infinity };
  }

  // Check if we need to reset daily credits
  const now = new Date();
  const lastReset = new Date(user.creditsResetAt);
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  let currentCredits = user.credits;

  // Reset daily credits if needed
  if (hoursSinceReset >= 24) {
    currentCredits = FREE_DAILY_CREDITS;
    await prisma.user.update({
      where: { id: userId },
      data: { credits: currentCredits, creditsResetAt: now },
    });
  }

  // Check if user has enough credits
  if (currentCredits < creditsToConsume) {
    return {
      success: false,
      error: `Insufficient credits. You have ${currentCredits} credit${currentCredits !== 1 ? "s" : ""} left.`,
      remainingCredits: currentCredits,
    };
  }

  // Deduct credits
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: creditsToConsume } },
    select: { credits: true },
  });

  return {
    success: true,
    remainingCredits: updatedUser.credits,
  };
}

// Get user credits and check for daily reset
export async function getUserCredits(userId: string): Promise<{
  credits: number;
  subscriptionTier: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      subscriptionTier: true,
      creditsResetAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if we need to reset daily credits
  if (!user.subscriptionTier) {
    const now = new Date();
    const lastReset = new Date(user.creditsResetAt);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { credits: FREE_DAILY_CREDITS, creditsResetAt: now },
        select: { credits: true, subscriptionTier: true },
      });
      return {
        credits: updatedUser.credits,
        subscriptionTier: updatedUser.subscriptionTier,
      };
    }
  }

  return {
    credits: user.credits,
    subscriptionTier: user.subscriptionTier,
  };
}

// Add credits to user (for purchases)
export async function addCreditsToUser(
  userId: string,
  creditsToAdd: number
): Promise<{
  success: boolean;
  newCredits: number;
}> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: creditsToAdd } },
    select: { credits: true },
  });

  return {
    success: true,
    newCredits: user.credits,
  };
}
