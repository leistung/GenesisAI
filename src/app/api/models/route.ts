import { NextResponse } from "next/server";
import { getActiveAIModels } from "@/lib/ai-service";
import { logger } from "@/lib/logger";

// GET /api/models - Get active AI models for frontend selection
export async function GET() {
  try {
    const models = await getActiveAIModels();
    return NextResponse.json({ models });
  } catch (error) {
    logger.error("Error fetching AI models", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
