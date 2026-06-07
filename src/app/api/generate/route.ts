import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAndConsumeCredits } from "@/lib/credits";
import { styleConfigs } from "@/lib/styles";
import { z } from "zod";

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  model: z.string().optional(),
  aspectRatio: z.string().optional(),
  style: z.string().optional(),
  color: z.string().optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  fastMode: z.boolean().optional(),
});

// POST /api/generate - Generate image using SSE (Server-Sent Events)
export async function POST(request: NextRequest) {
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
        } 
      }
    );
  }

  const session = await auth();
  const userId = session?.user?.id;

  const body = await request.json();
  
  // Validate input with Zod
  const validationResult = GenerateRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({ 
        error: "Invalid request", 
        details: validationResult.error.flatten() 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    prompt,
    negativePrompt,
    model = "raphael_basic",
    aspectRatio = "1:1",
    style,
    color,
    lighting,
    composition,
    fastMode = false,
  } = validationResult.data;

  const styleConfig = style ? styleConfigs[style] : null;

  let fullPrompt = prompt;
  let fullNegativePrompt = negativePrompt || "";

  if (styleConfig) {
    fullPrompt = `${styleConfig.systemPrompt} ${prompt}`;
    fullNegativePrompt = `${styleConfig.negativeSystemPrompt} ${fullNegativePrompt}`.trim();
  } else {
    if (style && style !== "none") fullPrompt += `, ${style} style`;
    if (color && color !== "none") fullPrompt += `, ${color} colors`;
    if (lighting && lighting !== "none") fullPrompt += `, ${lighting} lighting`;
    if (composition && composition !== "none") fullPrompt += `, ${composition} composition`;
  }

  // Check and consume credits for logged-in users
  if (userId) {
    const creditCheck = await checkAndConsumeCredits(userId, 1);
    if (!creditCheck.success) {
      return new Response(
        JSON.stringify({ error: creditCheck.error }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE messages
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ status: "started", message: "Initializing generation..." });

        // Simulate AI API call (replace with actual API integration)
        // In production, you would call:
        // - Stability AI API
        // - Replicate API
        // - OpenAI DALL-E API
        // - Or your own model endpoint

        send({ status: "processing", message: "Analyzing prompt...", progress: 10 });

        // Simulate processing time
        await sleep(500);
        send({ status: "processing", message: "Preparing model...", progress: 20 });

        await sleep(500);
        send({ status: "processing", message: "Generating image...", progress: 40 });

        // Call actual AI API here
        // Example with Stability AI:
        const imageUrl = await generateWithAI(fullPrompt, negativePrompt, model, aspectRatio);

        await sleep(500);
        send({ status: "processing", message: "Finalizing...", progress: 80 });

        // Save image to database
        const image = await prisma.image.create({
          data: {
            userId: userId || null,
            prompt,
            negativePrompt,
            model,
            aspectRatio,
            style,
            color,
            lighting,
            composition,
            imageUrl,
            isPublic: !userId, // Guest images are public
          },
        });

        send({
          status: "completed",
          message: "Image generated successfully!",
          progress: 100,
          image: {
            id: image.id,
            url: imageUrl,
            prompt,
          },
        });

      } catch (error) {
        console.error("Generation error:", error);
        send({
          status: "error",
          message: error instanceof Error ? error.message : "Generation failed",
        });
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

// Helper function for sleep
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// AI Generation function
// Replace this with actual API integration
async function generateWithAI(
  prompt: string,
  negativePrompt?: string,
  model?: string,
  aspectRatio?: string
): Promise<string> {
  // In production, integrate with:
  // 1. Stability AI: https://api.stability.ai
  // 2. Replicate: https://api.replicate.com
  // 3. OpenAI DALL-E: https://api.openai.com
  // 4. Cloudflare AI: https://api.cloudflare.com/client/v4/accounts/{account_id}/ai

  // For demo, return a placeholder image
  // In production, you would:
  // 1. Call the AI API
  // 2. Get the base64 image or URL
  // 3. Upload to R2/S3 for permanent storage
  // 4. Return the permanent URL

  const seed = Math.floor(Math.random() * 1000);
  
  // Use Unsplash as placeholder (replace with actual AI generation)
  const [width, height] = getDimensions(aspectRatio || "1:1");
  
  // Simulate API call delay
  await sleep(1500);

  // Return a placeholder image URL
  // In production, this would be the URL from your AI API or storage
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function getDimensions(aspectRatio: string): [number, number] {
  const ratios: Record<string, [number, number]> = {
    "1:1": [1024, 1024],
    "16:9": [1024, 576],
    "9:16": [576, 1024],
    "4:3": [1024, 768],
    "3:4": [768, 1024],
  };
  return ratios[aspectRatio] || [1024, 1024];
}
