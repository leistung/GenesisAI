import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// POST /api/v1/images/:id/like - Like an image (toggle)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: imageId } = await params;

  try {
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: { userId_imageId: { userId: session.user.id, imageId } },
    });

    if (existing) {
      // Unlike: remove like and decrement count
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.image.update({
          where: { id: imageId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
      const updated = await prisma.image.findUnique({ where: { id: imageId } });
      return NextResponse.json({ liked: false, likes: updated?.likes ?? 0 });
    }

    // Like: create like and increment count
    await prisma.$transaction([
      prisma.like.create({
        data: { userId: session.user.id, imageId },
      }),
      prisma.image.update({
        where: { id: imageId },
        data: { likes: { increment: 1 } },
      }),
    ]);
    const updated = await prisma.image.findUnique({ where: { id: imageId } });
    return NextResponse.json({ liked: true, likes: updated?.likes ?? 0 });
  } catch (error) {
    logger.error("Error toggling like", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
