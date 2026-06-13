import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/images/:id/comments - Get all comments for an image (nested with replies)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;

  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, isPublic: true, userId: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // If the image is not public, check if the requester is the owner
    if (!image.isPublic) {
      const session = await auth();
      if (!session?.user?.id || image.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const comments = await prisma.comment.findMany({
      where: { imageId, parentId: null },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    logger.error("Error fetching comments", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/images/:id/comments - Create a comment or reply
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
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, isPublic: true, userId: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // If the image is not public, only the owner can comment
    if (!image.isPublic && image.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // If parentId is provided, validate that the parent comment exists and belongs to the same image
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }

      if (parentComment.imageId !== imageId) {
        return NextResponse.json({ error: "Parent comment does not belong to this image" }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        imageId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    logger.info("Comment created", {
      commentId: comment.id,
      imageId,
      userId: session.user.id,
      parentId: parentId || null,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    logger.error("Error creating comment", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
