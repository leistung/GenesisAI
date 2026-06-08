import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/v1/bookmarks - Get user's bookmarked images
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        image: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const images = bookmarks.map((b) => ({
      id: b.image.id,
      imageUrl: b.image.imageUrl,
      prompt: b.image.prompt,
      style: b.image.style,
      author: b.image.user?.name || "Anonymous",
      likes: b.image.likes,
      bookmarkedAt: b.createdAt,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    logger.error("Error fetching bookmarks", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

// POST /api/v1/bookmarks - Add a bookmark
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageId } = await request.json();
    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_imageId: { userId: session.user.id, imageId },
      },
      create: { userId: session.user.id, imageId },
      update: {},
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    logger.error("Error adding bookmark", { error: String(error) });
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 });
  }
}
