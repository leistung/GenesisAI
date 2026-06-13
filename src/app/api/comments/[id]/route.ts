import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// DELETE /api/comments/:id - Delete a comment (author or image owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        image: {
          select: { userId: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only the comment author or the image owner can delete
    const isCommentAuthor = comment.userId === session.user.id;
    const isImageOwner = comment.image.userId === session.user.id;

    if (!isCommentAuthor && !isImageOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the comment (cascade will delete all replies)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    logger.info("Comment deleted", {
      commentId,
      userId: session.user.id,
      deletedByAuthor: isCommentAuthor,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting comment", { error: String(error), commentId });
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
