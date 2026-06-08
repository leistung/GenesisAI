import OpenAI from "openai";
import { prisma } from "./db";
import { logger } from "./logger";

// AI Model configuration from database
interface AIModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  creditsCost: number;
  supportsTextToImage: boolean;
  supportsImageEdit: boolean;
  supportsNegativePrompt: boolean;
  maxPromptLength: number;
  supportedAspectRatios: string[];
  stylePrompts: Record<string, string>;
}

// Image generation result
interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  error?: string;
  creditsCost: number;
  modelUsed: string;
}

// Get AI model config from database
export async function getAIModelConfig(modelName?: string): Promise<AIModelConfig | null> {
  try {
    const model = await prisma.aIModel.findFirst({
      where: {
        isActive: true,
        ...(modelName ? { name: modelName } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    if (!model) return null;

    return {
      id: model.id,
      name: model.name,
      displayName: model.displayName,
      provider: model.provider,
      baseUrl: model.baseUrl,
      apiKey: model.apiKey,
      modelId: model.modelId,
      creditsCost: model.creditsCost,
      supportsTextToImage: model.supportsTextToImage,
      supportsImageEdit: model.supportsImageEdit,
      supportsNegativePrompt: model.supportsNegativePrompt,
      maxPromptLength: model.maxPromptLength,
      supportedAspectRatios: JSON.parse(model.supportedAspectRatios),
      stylePrompts: JSON.parse(model.stylePrompts),
    };
  } catch (error) {
    logger.error("Failed to get AI model config", { error: String(error) });
    return null;
  }
}

// Get all active AI models for frontend selection
export async function getActiveAIModels() {
  try {
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        creditsCost: true,
        supportsTextToImage: true,
        supportsImageEdit: true,
        supportsNegativePrompt: true,
        maxPromptLength: true,
        supportedAspectRatios: true,
        sortOrder: true,
      },
    });

    return models.map((m) => ({
      ...m,
      supportedAspectRatios: JSON.parse(m.supportedAspectRatios),
    }));
  } catch (error) {
    logger.error("Failed to get active AI models", { error: String(error) });
    return [];
  }
}

// Map aspect ratio to size string for OpenAI-compatible API
function mapAspectRatioToSize(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1536x864",
    "9:16": "864x1536",
    "4:3": "1152x864",
    "3:4": "864x1152",
  };
  return sizeMap[aspectRatio] || "1024x1024";
}

// Build the full prompt with style enhancement
function buildPrompt(
  prompt: string,
  style?: string,
  stylePrompts?: Record<string, string>,
  color?: string,
  lighting?: string,
  composition?: string
): string {
  let fullPrompt = prompt;

  // Add style-specific enhancement from model config
  if (style && style !== "none" && stylePrompts?.[style]) {
    fullPrompt = `${stylePrompts[style]}, ${fullPrompt}`;
  }

  // Add additional parameters
  if (color && color !== "none") fullPrompt += `, ${color} colors`;
  if (lighting && lighting !== "none") fullPrompt += `, ${lighting} lighting`;
  if (composition && composition !== "none") fullPrompt += `, ${composition} composition`;

  return fullPrompt;
}

/**
 * Generate image using OpenAI-compatible API (DashScope, etc.)
 * Uses LangChain-compatible approach with OpenAI SDK
 */
export async function generateImage(params: {
  prompt: string;
  negativePrompt?: string;
  modelName?: string;
  aspectRatio?: string;
  style?: string;
  color?: string;
  lighting?: string;
  composition?: string;
  referenceImage?: string;
}): Promise<GenerationResult> {
  const {
    prompt,
    negativePrompt,
    modelName,
    aspectRatio = "1:1",
    style,
    color,
    lighting,
    composition,
    referenceImage,
  } = params;

  // Get model config from database
  const modelConfig = await getAIModelConfig(modelName);
  if (!modelConfig) {
    return {
      success: false,
      error: `AI model '${modelName || "default"}' not found or inactive`,
      creditsCost: 0,
      modelUsed: modelName || "unknown",
    };
  }

  // Build enhanced prompt
  const enhancedPrompt = buildPrompt(
    prompt,
    style,
    modelConfig.stylePrompts,
    color,
    lighting,
    composition
  );

  // Validate prompt length
  if (enhancedPrompt.length > modelConfig.maxPromptLength) {
    return {
      success: false,
      error: `Prompt too long (${enhancedPrompt.length}/${modelConfig.maxPromptLength})`,
      creditsCost: 0,
      modelUsed: modelConfig.name,
    };
  }

  // Validate aspect ratio
  if (!modelConfig.supportedAspectRatios.includes(aspectRatio)) {
    return {
      success: false,
      error: `Aspect ratio '${aspectRatio}' not supported by model '${modelConfig.displayName}'`,
      creditsCost: 0,
      modelUsed: modelConfig.name,
    };
  }

  try {
    // Create OpenAI client with model-specific configuration
    const client = new OpenAI({
      apiKey: modelConfig.apiKey,
      baseURL: modelConfig.baseUrl,
    });

    const size = mapAspectRatioToSize(aspectRatio);

    logger.info("Generating image", {
      model: modelConfig.name,
      modelId: modelConfig.modelId,
      promptLength: enhancedPrompt.length,
      size,
      hasReferenceImage: !!referenceImage,
    });

    let result;

    if (referenceImage && modelConfig.supportsImageEdit) {
      // Image edit mode: use chat completion with image input
      result = await generateWithImageEdit(
        client,
        modelConfig,
        enhancedPrompt,
        referenceImage,
        size
      );
    } else {
      // Text-to-image mode
      result = await generateTextToImage(
        client,
        modelConfig,
        enhancedPrompt,
        negativePrompt,
        size
      );
    }

    return {
      ...result,
      creditsCost: modelConfig.creditsCost,
      modelUsed: modelConfig.name,
    };
  } catch (error) {
    logger.error("Image generation failed", {
      error: error instanceof Error ? error.message : String(error),
      model: modelConfig.name,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image generation failed",
      creditsCost: 0,
      modelUsed: modelConfig.name,
    };
  }
}

// Text-to-image generation using OpenAI-compatible API
async function generateTextToImage(
  client: OpenAI,
  modelConfig: AIModelConfig,
  prompt: string,
  negativePrompt?: string,
  size?: string
): Promise<Omit<GenerationResult, "creditsCost" | "modelUsed">> {
  try {
    // Use OpenAI images.generate endpoint (compatible with DashScope)
    const response = await client.images.generate({
      model: modelConfig.modelId,
      prompt,
      n: 1,
      size: (size || "1024x1024") as "1024x1024" | "1536x864" | "864x1536" | "1152x864" | "864x1152",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0];
    if (!imageData) {
      return { success: false, error: "No image data returned from API" };
    }

    // If b64_json format, convert to buffer
    if (imageData.b64_json) {
      const imageBuffer = Buffer.from(imageData.b64_json, "base64");
      return { success: true, imageBuffer };
    }

    // If URL format, return the URL
    if (imageData.url) {
      return { success: true, imageUrl: imageData.url };
    }

    return { success: false, error: "Unexpected response format from API" };
  } catch (error) {
    // Handle DashScope-specific error format
    if (error instanceof OpenAI.APIError) {
      const message = error.error?.message || error.message || "API error";
      return { success: false, error: `API error: ${message}` };
    }
    throw error;
  }
}

// Image edit with reference image using chat completion
async function generateWithImageEdit(
  client: OpenAI,
  modelConfig: AIModelConfig,
  prompt: string,
  referenceImage: string,
  size?: string
): Promise<Omit<GenerationResult, "creditsCost" | "modelUsed">> {
  try {
    // For image editing, use chat completions with vision
    // The reference image is sent as a base64 data URL
    const response = await client.chat.completions.create({
      model: modelConfig.modelId,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: referenceImage },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    // Extract image URL from response
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No content in response" };
    }

    // Try to extract image URL from markdown or JSON in response
    const urlMatch = content.match(/https?:\/\/[^\s"')\]]+\.(png|jpg|jpeg|webp)/i);
    if (urlMatch) {
      return { success: true, imageUrl: urlMatch[0] };
    }

    // If the response contains base64 data
    const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (base64Match) {
      const base64Data = base64Match[0].split(",")[1];
      const imageBuffer = Buffer.from(base64Data, "base64");
      return { success: true, imageBuffer };
    }

    // Fallback: use the images.generate endpoint with the reference
    // Some models support image editing through the images endpoint
    const imageResponse = await client.images.generate({
      model: modelConfig.modelId,
      prompt,
      n: 1,
      size: (size || "1024x1024") as "1024x1024",
      response_format: "b64_json",
    });

    const imageData = imageResponse.data?.[0];
    if (imageData?.b64_json) {
      const imageBuffer = Buffer.from(imageData.b64_json, "base64");
      return { success: true, imageBuffer };
    }
    if (imageData?.url) {
      return { success: true, imageUrl: imageData.url };
    }

    return { success: false, error: "Could not extract image from response" };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const message = error.error?.message || error.message || "API error";
      return { success: false, error: `API error: ${message}` };
    }
    throw error;
  }
}

/**
 * LangGraph-style workflow for image generation
 * Orchestrates the full generation pipeline:
 * 1. Validate & enhance prompt
 * 2. Select model
 * 3. Generate image
 * 4. Upload to storage (optional)
 * 5. Save to database
 */
export async function runGenerationWorkflow(params: {
  prompt: string;
  negativePrompt?: string;
  modelName?: string;
  aspectRatio?: string;
  style?: string;
  color?: string;
  lighting?: string;
  composition?: string;
  referenceImage?: string;
  userId?: string;
}): Promise<{
  success: boolean;
  image?: { id: string; url: string; prompt: string };
  error?: string;
  creditsCost: number;
  modelUsed: string;
}> {
  const { userId, ...generateParams } = params;

  // Step 1: Generate image
  const result = await generateImage(generateParams);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      creditsCost: 0,
      modelUsed: result.modelUsed,
    };
  }

  // Step 2: Upload to storage if buffer and configured
  let imageUrl = result.imageUrl || "";

  if (result.imageBuffer && userId) {
    const { uploadImage, generateImageKey, isStorageConfigured } = await import("./storage");
    if (isStorageConfigured()) {
      const imageId = crypto.randomUUID();
      const key = generateImageKey(userId, imageId);
      const uploadedUrl = await uploadImage(result.imageBuffer, key, "image/png");
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
  }

  // If we have a buffer but no storage, convert to data URL (temporary)
  if (!imageUrl && result.imageBuffer) {
    const base64 = result.imageBuffer.toString("base64");
    imageUrl = `data:image/png;base64,${base64}`;
  }

  // Step 3: Save to database
  const image = await prisma.image.create({
    data: {
      userId: userId || null,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      model: result.modelUsed,
      aspectRatio: params.aspectRatio || "1:1",
      style: params.style,
      color: params.color,
      lighting: params.lighting,
      composition: params.composition,
      imageUrl,
      isPublic: !userId,
    },
  });

  logger.info("Image saved to database", {
    imageId: image.id,
    model: result.modelUsed,
    userId,
  });

  return {
    success: true,
    image: {
      id: image.id,
      url: imageUrl,
      prompt: params.prompt,
    },
    creditsCost: result.creditsCost,
    modelUsed: result.modelUsed,
  };
}
