import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/images - Get user's images or public community images
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get("public") === "true";
  const style = searchParams.get("style");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (isPublic) {
    try {
      const where: Record<string, unknown> = { isPublic: true };
      if (style) where.style = style;

      const images = await prisma.image.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 50),
      });

      const formatted = images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        prompt: (img as any).prompt || "",
        author: (img as any).user?.name || "Anonymous",
        likes: (img as any).likes || 0,
        style: img.style,
        createdAt: img.createdAt,
      }));

      return NextResponse.json({ images: formatted });
    } catch (error) {
      console.error("Error fetching public images:", error);
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
      take: Math.min(limit, 50),
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
