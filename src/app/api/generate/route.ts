import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAndConsumeCredits } from "@/lib/credits";
import { styleConfigs } from "@/lib/styles";
import { uploadImage, generateImageKey, isStorageConfigured } from "@/lib/storage";
import { logger } from "@/lib/logger";
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
  referenceImage: z.string().optional(), // base64 data URL
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
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ status: "started", message: "Initializing generation..." });
        send({ status: "processing", message: "Analyzing prompt...", progress: 10 });

        // Call AI API
        const aiResult = await generateWithAI(fullPrompt, fullNegativePrompt, model, aspectRatio, validationResult.data.referenceImage);

        send({ status: "processing", message: "Preparing model...", progress: 20 });
        send({ status: "processing", message: "Generating image...", progress: 40 });

        if (!aiResult.success) {
          throw new Error(aiResult.error || "AI generation failed");
        }

        send({ status: "processing", message: "Finalizing...", progress: 80 });

        // Upload to storage if configured, otherwise use the URL directly
        let imageUrl = aiResult.imageUrl || "";

        if (aiResult.imageBuffer && isStorageConfigured() && userId) {
          const imageId = crypto.randomUUID();
          const key = generateImageKey(userId, imageId);
          const uploadedUrl = await uploadImage(aiResult.imageBuffer, key, "image/png");
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }

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
            isPublic: !userId,
          },
        });

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
          image: {
            id: image.id,
            url: imageUrl,
            prompt,
          },
        });
      } catch (error) {
        logger.error("Generation error", { error: error instanceof Error ? error.message : String(error), userId });
        send({
          status: "error",
          message: error instanceof Error ? error.message : "Generation failed",
        });

        // Refund credits on failure
        if (userId) {
          try {
            const { addCreditsToUser } = await import("@/lib/credits");
            await addCreditsToUser(userId, 1);
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

// AI Generation function - supports multiple providers
async function generateWithAI(
  prompt: string,
  negativePrompt?: string,
  model?: string,
  aspectRatio?: string,
  referenceImage?: string
): Promise<{ success: boolean; imageUrl?: string; imageBuffer?: Buffer; error?: string }> {
  const provider = process.env.AI_PROVIDER || "placeholder";

  try {
    switch (provider) {
      case "stability":
        return await generateWithStabilityAI(prompt, negativePrompt, model, aspectRatio, referenceImage);
      case "replicate":
        return await generateWithReplicate(prompt, negativePrompt, model, aspectRatio);
      case "openai":
        return await generateWithOpenAI(prompt, aspectRatio);
      case "placeholder":
      default:
        return await generatePlaceholder(prompt, aspectRatio);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI generation failed",
    };
  }
}

// Stability AI integration
async function generateWithStabilityAI(
  prompt: string,
  negativePrompt?: string,
  model?: string,
  aspectRatio?: string,
  referenceImage?: string
): Promise<{ success: boolean; imageUrl?: string; imageBuffer?: Buffer; error?: string }> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return { success: false, error: "Stability API key not configured" };

  const body: Record<string, unknown> = {
    prompt,
    negative_prompt: negativePrompt || undefined,
    output_format: "png",
    aspect_ratio: aspectRatio || "1:1",
  };

  if (referenceImage) {
    // Extract base64 data from data URL
    const base64Data = referenceImage.split(",")[1];
    if (base64Data) {
      body.image = base64Data;
      body.strength = 0.7; // How much the reference image influences the output
    }
  }

  const response = await fetch(
    `https://api.stability.ai/v2beta/stable-image/generate/${model === "sd3" ? "sd3-large" : "core"}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error: `Stability AI error: ${error}` };
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return { success: true, imageBuffer };
}

// Replicate integration
async function generateWithReplicate(
  prompt: string,
  negativePrompt?: string,
  model?: string,
  aspectRatio?: string
): Promise<{ success: boolean; imageUrl?: string; imageBuffer?: Buffer; error?: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) return { success: false, error: "Replicate API token not configured" };

  const [width, height] = getDimensions(aspectRatio || "1:1");
  const modelVersion = model || "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: modelVersion.includes("/") ? undefined : modelVersion,
      model: modelVersion.includes("/") ? modelVersion : undefined,
      input: {
        prompt,
        negative_prompt: negativePrompt || "",
        width,
        height,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error: `Replicate error: ${error}` };
  }

  const prediction = await response.json();

  // Poll for result
  let result = prediction;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000);
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Token ${apiToken}` },
    });
    result = await pollResponse.json();

    if (result.status === "succeeded") {
      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return { success: true, imageUrl };
    }
    if (result.status === "failed") {
      return { success: false, error: "Replicate generation failed" };
    }
  }

  return { success: false, error: "Replicate generation timed out" };
}

// OpenAI DALL-E integration
async function generateWithOpenAI(
  prompt: string,
  aspectRatio?: string
): Promise<{ success: boolean; imageUrl?: string; imageBuffer?: Buffer; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { success: false, error: "OpenAI API key not configured" };

  const size = aspectRatio === "16:9" ? "1792x1024"
    : aspectRatio === "9:16" ? "1024x1792"
    : "1024x1024";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error: `OpenAI error: ${error}` };
  }

  const data = await response.json();
  const base64 = data.data?.[0]?.b64_json;
  if (base64) {
    const imageBuffer = Buffer.from(base64, "base64");
    return { success: true, imageBuffer };
  }

  const imageUrl = data.data?.[0]?.url;
  return { success: true, imageUrl };
}

// Placeholder for development/demo
async function generatePlaceholder(
  prompt: string,
  aspectRatio?: string
): Promise<{ success: boolean; imageUrl: string; error?: string }> {
  const seed = Math.floor(Math.random() * 1000);
  const [width, height] = getDimensions(aspectRatio || "1:1");
  await sleep(1500);
  return {
    success: true,
    imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
