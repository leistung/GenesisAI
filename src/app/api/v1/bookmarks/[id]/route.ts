import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// DELETE /api/v1/bookmarks/:id - Remove a bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: imageId } = await params;

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_imageId: { userId: session.user.id, imageId },
      },
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error removing bookmark", { error: String(error) });
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
