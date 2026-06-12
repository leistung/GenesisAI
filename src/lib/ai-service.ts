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

// Map aspect ratio to DashScope size string (width*height format)
function mapAspectRatioToSize(aspectRatio: string, modelId: string): string {
  // qwen-image-2.0 series uses different default sizes
  if (modelId.includes("qwen-image-2.0")) {
    const sizeMap: Record<string, string> = {
      "1:1": "2048*2048",
      "16:9": "2688*1536",
      "9:16": "1536*2688",
      "4:3": "2368*1728",
      "3:4": "1728*2368",
    };
    return sizeMap[aspectRatio] || "2048*2048";
  }

  // qwen-image-max, qwen-image-plus, qwen-image-edit series
  const sizeMap: Record<string, string> = {
    "1:1": "1328*1328",
    "16:9": "1664*928",
    "9:16": "928*1664",
    "4:3": "1472*1104",
    "3:4": "1104*1472",
  };
  return sizeMap[aspectRatio] || "1328*1328";
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
 * Call DashScope multimodal-generation API (native HTTP)
 * Used for both text-to-image and image-edit models
 */
async function callDashScopeAPI(
  modelConfig: AIModelConfig,
  prompt: string,
  negativePrompt: string | undefined,
  size: string,
  referenceImage?: string
): Promise<Omit<GenerationResult, "creditsCost" | "modelUsed">> {
  // DashScope native API endpoint
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

  // Build messages content
  const content: Array<{ text?: string; image?: string }> = [];

  // If reference image provided, add it first
  if (referenceImage) {
    content.push({ image: referenceImage });
  }

  // Add the text prompt
  content.push({ text: prompt });

  // Build request body following DashScope API spec
  const requestBody: Record<string, unknown> = {
    model: modelConfig.modelId,
    input: {
      messages: [
        {
          role: "user",
          content,
        },
      ],
    },
    parameters: {
      size,
      n: 1,
    },
  };

  // Add negative prompt if provided
  if (negativePrompt) {
    (requestBody.parameters as Record<string, unknown>).negative_prompt = negativePrompt;
  }

  logger.info("Calling DashScope API", {
    model: modelConfig.modelId,
    size,
    hasReferenceImage: !!referenceImage,
    hasNegativePrompt: !!negativePrompt,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMsg = `DashScope API error: ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMsg = errorBody.message || errorBody.error?.message || errorMsg;
      logger.error("DashScope API error response", { status: response.status, body: errorBody });
    } catch {
      // Could not parse error body
    }
    return { success: false, error: errorMsg };
  }

  const data = await response.json();

  // Check for API-level errors
  if (data.code) {
    return { success: false, error: data.message || `DashScope error: ${data.code}` };
  }

  // Extract image URL from response
  // Response format: { output: { choices: [{ message: { content: [{ image: "url" }] } } ] } }
  const choices = data.output?.choices;
  if (!choices || choices.length === 0) {
    return { success: false, error: "No image generated (empty choices in response)" };
  }

  const messageContent = choices[0]?.message?.content;
  if (!messageContent || messageContent.length === 0) {
    return { success: false, error: "No content in API response" };
  }

  // Find the image in the content array
  const imageItem = messageContent.find((item: { image?: string }) => item.image);
  if (!imageItem?.image) {
    return { success: false, error: "No image URL found in API response" };
  }

  const imageUrl = imageItem.image as string;

  // Download the image to get the buffer (URL is temporary, valid for 24 hours)
  try {
    const imageResponse = await fetch(imageUrl);
    if (imageResponse.ok) {
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      return { success: true, imageUrl, imageBuffer };
    }
  } catch (downloadError) {
    logger.warn("Failed to download generated image, returning URL only", {
      error: String(downloadError),
    });
  }

  return { success: true, imageUrl };
}

/**
 * Generate image using DashScope native API
 */
export async function generateImage(params: {
  prompt: string;
  negativePrompt?: string;
  defaultNegativePrompt?: string;
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
    defaultNegativePrompt,
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

  // Combine negative prompts: user-provided takes priority, style default as fallback
  const effectiveNegativePrompt = negativePrompt || defaultNegativePrompt || undefined;

  try {
    const size = mapAspectRatioToSize(aspectRatio, modelConfig.modelId);

    logger.info("Generating image", {
      model: modelConfig.name,
      modelId: modelConfig.modelId,
      provider: modelConfig.provider,
      promptLength: enhancedPrompt.length,
      hasNegativePrompt: !!effectiveNegativePrompt,
      size,
      hasReferenceImage: !!referenceImage,
    });

    // Route based on provider
    if (modelConfig.provider === "dashscope") {
      const result = await callDashScopeAPI(
        modelConfig,
        enhancedPrompt,
        effectiveNegativePrompt,
        size,
        referenceImage
      );
      return {
        ...result,
        creditsCost: modelConfig.creditsCost,
        modelUsed: modelConfig.name,
      };
    }

    // Fallback for other providers (not yet implemented)
    return {
      success: false,
      error: `Provider '${modelConfig.provider}' is not supported yet`,
      creditsCost: 0,
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
  defaultNegativePrompt?: string;
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
