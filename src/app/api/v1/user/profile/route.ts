import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: result.data,
      select: { id: true, name: true, email: true },
    });

    logger.info("Profile updated", { userId: user.id });
    return NextResponse.json({ user });
  } catch (error) {
    logger.error("Profile update error", { error: String(error) });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
