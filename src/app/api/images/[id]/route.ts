import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteImage as deleteImageFromStorage, generateImageKey } from "@/lib/storage";
import { logger } from "@/lib/logger";

// GET /api/images/:id - Get image detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;

  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { comments: true },
        },
      },
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _count, ...imageData } = image;

    return NextResponse.json({
      ...imageData,
      commentCount: _count.comments,
    });
  } catch (error) {
    logger.error("Error fetching image", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}

// DELETE /api/images/:id - Delete a user's image
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
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from S3/R2 storage if configured
    if (image.userId) {
      const key = generateImageKey(image.userId, imageId);
      await deleteImageFromStorage(key);
    }

    await prisma.image.delete({
      where: { id: imageId },
    });

    logger.info("Image deleted", { imageId, userId: session.user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting image", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}

// PATCH /api/images/:id - Update image (e.g., publish/unpublish)
export async function PATCH(
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
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
    }

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: { isPublic },
    });

    logger.info("Image updated", { imageId, isPublic: updated.isPublic });
    return NextResponse.json({ success: true, image: updated });
  } catch (error) {
    logger.error("Error updating image", { error: String(error), imageId });
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
}
