import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/images - Get user's images or public community images (with cursor pagination)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get("public") === "true";
  const style = searchParams.get("style");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const cursor = searchParams.get("cursor"); // cursor = last image ID

  if (isPublic) {
    try {
      const where: Record<string, unknown> = { isPublic: true };
      if (style) {
        where.OR = [
          { style },
          { style: null },
        ];
      }

      const images = await prisma.image.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit + 1, // Take one extra to determine if there's a next page
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const hasNextPage = images.length > limit;
      const trimmedImages = hasNextPage ? images.slice(0, -1) : images;

      const formatted = trimmedImages.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        prompt: img.prompt || "",
        author: img.user?.name || "Anonymous",
        likes: img.likes,
        style: img.style,
        createdAt: img.createdAt,
      }));

      return NextResponse.json({
        images: formatted,
        nextCursor: hasNextPage ? trimmedImages[trimmedImages.length - 1].id : null,
      });
    } catch (error) {
      logger.error("Error fetching public images", { error: String(error) });
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const images = await prisma.image.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = images.length > limit;
    const trimmedImages = hasNextPage ? images.slice(0, -1) : images;

    return NextResponse.json({
      images: trimmedImages,
      nextCursor: hasNextPage ? trimmedImages[trimmedImages.length - 1].id : null,
    });
  } catch (error) {
    logger.error("Error fetching user images", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
