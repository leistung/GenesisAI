import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAndConsumeCredits, addCreditsToUser } from "@/lib/credits";
import { runGenerationWorkflow, getAIModelConfig } from "@/lib/ai-service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  defaultNegativePrompt: z.string().optional(),  // Auto-injected from zone config
  model: z.string().optional(),
  aspectRatio: z.string().optional(),
  style: z.string().optional(),
  color: z.string().optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  fastMode: z.boolean().optional(),
  referenceImage: z.string().optional(),
});

// POST /api/generate - Generate image using SSE (Server-Sent Events)
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Check rate limit
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      }
    );
  }

  const session = await auth();
  const userId = session?.user?.id;

  // 强制要求登录才能生成图像，防止匿名滥用
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Please sign in to generate images" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();

  // Validate input with Zod
  const validationResult = GenerateRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    prompt,
    negativePrompt,
    defaultNegativePrompt,
    model,
    aspectRatio = "1:1",
    style,
    color,
    lighting,
    composition,
    referenceImage,
  } = validationResult.data;

  // Look up model config to get credits cost
  const modelConfig = await getAIModelConfig(model);
  const creditsCost = modelConfig?.creditsCost || 1;

  // Check and consume credits (user is guaranteed to be authenticated here)
  const creditCheck = await checkAndConsumeCredits(userId, creditsCost);
  if (!creditCheck.success) {
    return new Response(
      JSON.stringify({ error: creditCheck.error }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ status: "started", message: "Initializing generation..." });
        send({ status: "processing", message: "Analyzing prompt...", progress: 10 });

        // Look up model info for progress messages
        const modelName = modelConfig?.displayName || model || "AI";
        send({ status: "processing", message: `Preparing ${modelName} model...`, progress: 20 });
        send({ status: "processing", message: "Generating image...", progress: 40 });

        // Run the LangGraph-style generation workflow
        const result = await runGenerationWorkflow({
          prompt,
          negativePrompt,
          defaultNegativePrompt,
          modelName: model,
          aspectRatio,
          style,
          color,
          lighting,
          composition,
          referenceImage,
          userId,
        });

        if (!result.success) {
          throw new Error(result.error || "AI generation failed");
        }

        send({ status: "processing", message: "Finalizing...", progress: 80 });

        const duration = Date.now() - startTime;
        logger.apiRequest({
          method: "POST",
          path: "/api/generate",
          status: 200,
          duration,
          userId,
        });

        send({
          status: "completed",
          message: "Image generated successfully!",
          progress: 100,
          image: result.image,
          creditsCost: result.creditsCost,
          modelUsed: result.modelUsed,
        });
      } catch (error) {
        logger.error("Generation error", {
          error: error instanceof Error ? error.message : String(error),
          userId,
        });
        send({
          status: "error",
          message: error instanceof Error ? error.message : "Generation failed",
        });

        // Refund credits on failure
        if (userId && creditsCost > 0) {
          try {
            await addCreditsToUser(userId, creditsCost);
          } catch {
            // Ignore refund errors
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
