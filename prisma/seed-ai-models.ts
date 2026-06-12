import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_KEY = "";

async function main() {
  const models = [
    // ============================================================
    // Agent 1: Qwen Image Edit — 动漫专区 + 创意专区
    // 支持文生图 + 图像编辑，适合创意类生成
    // ============================================================
    {
      name: "qwen-image-edit",
      displayName: "Qwen Image 2.0 Pro",
      provider: "dashscope",
      baseUrl: "https://dashscope.aliyuncs.com/api/v1",
      apiKey: API_KEY,
      modelId: "qwen-image-2.0-pro",
      creditsCost: 1,
      isActive: true,
      sortOrder: 0,
      supportsTextToImage: true,
      supportsImageEdit: true,
      supportsNegativePrompt: true,
      maxPromptLength: 2000,
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      stylePrompts: JSON.stringify({
        anime: "masterpiece, best quality, ultra detailed, anime style, vibrant colors, clean lineart, beautiful anime illustration, studio quality anime, cel shaded, soft shading, expressive eyes, dynamic pose, professional anime art, trending on pixiv,",
        portrait: "masterpiece, best quality, ultra detailed, professional portrait photography, studio lighting, 8k, high resolution, detailed skin texture, natural skin tone, professional retouching, sharp focus, shallow depth of field, bokeh background, magazine quality, fashion photography,",
        landscape: "masterpiece, best quality, ultra detailed, professional landscape photography, 8k, high resolution, dramatic composition, golden hour lighting, high dynamic range, national geographic style, breathtaking scenery, sharp focus, wide angle, atmospheric,",
        creative: "masterpiece, best quality, ultra detailed, creative digital art, artistic interpretation, unique composition, expressive brushstrokes, imaginative concept, trending on artstation, behance, vivid colors, conceptual art, gallery quality,",
        product: "masterpiece, best quality, ultra detailed, professional product photography, clean background, studio lighting, commercial quality, sharp focus, color accurate, e-commerce ready, premium feel, luxury, minimal composition, soft shadows, 8k,",
      }),
    },

    // ============================================================
    // Agent 2: Wanx v3 — 肖像专区 + 风景专区 + 产品专区
    // 支持文生图，以写实/摄影风格见长
    // ============================================================
    {
      name: "wanx-v3",
      displayName: "Wanx v3",
      provider: "dashscope",
      baseUrl: "https://dashscope.aliyuncs.com/api/v1",
      apiKey: API_KEY,
      modelId: "wanx-v3",
      creditsCost: 2,
      isActive: true,
      sortOrder: 1,
      supportsTextToImage: true,
      supportsImageEdit: false,
      supportsNegativePrompt: true,
      maxPromptLength: 2000,
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      stylePrompts: JSON.stringify({
        anime: "anime style, manga art, cel shaded, vibrant colors, detailed character design, Japanese animation, trending on pixiv,",
        portrait: "photorealistic portrait, professional photography, 8k, studio lighting, detailed skin texture, sharp focus, natural skin tone, bokeh, fashion magazine quality,",
        landscape: "photorealistic landscape, 8k, national geographic, golden hour, dramatic sky, wide angle, sharp focus, breathtaking scenery,",
        creative: "digital art, artistic, creative, trending on artstation, vibrant colors, intricate details, concept art, masterpiece,",
        product: "photorealistic product photography, studio lighting, clean white background, commercial quality, sharp focus, e-commerce ready, minimal, premium,",
      }),
    },

    // ============================================================
    // Agent 3: Qwen Image Plus — 通用高质量模型
    // 所有分区均可使用的高质量后备模型
    // ============================================================
    {
      name: "qwen-image-plus",
      displayName: "Qwen Image Plus",
      provider: "dashscope",
      baseUrl: "https://dashscope.aliyuncs.com/api/v1",
      apiKey: API_KEY,
      modelId: "qwen-image-plus",
      creditsCost: 3,
      isActive: true,
      sortOrder: 2,
      supportsTextToImage: true,
      supportsImageEdit: false,
      supportsNegativePrompt: true,
      maxPromptLength: 2000,
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      stylePrompts: JSON.stringify({
        anime: "masterpiece, best quality, ultra detailed, 4k, anime style, exquisite illustration, vibrant colors, clean lineart, gorgeous, studio quality anime,",
        portrait: "masterpiece, best quality, ultra detailed, 4k, professional portrait, studio lighting, detailed skin texture, sharp focus, magazine quality,",
        landscape: "masterpiece, best quality, ultra detailed, 4k, professional landscape photography, dramatic composition, golden hour, national geographic, breathtaking,",
        creative: "masterpiece, best quality, ultra detailed, 4k, creative digital art, unique artistic vision, trending on artstation, behance featured, gallery quality,",
        product: "masterpiece, best quality, ultra detailed, 4k, professional product photography, clean studio lighting, premium commercial quality, sharp focus, e-commerce,",
      }),
    },
  ];

  for (const model of models) {
    await prisma.aIModel.upsert({
      where: { name: model.name },
      update: model,
      create: model,
    });
    console.log(`✅ Seeded model: ${model.displayName} (${model.name})`);
  }

  console.log("\n🎉 All AI models seeded successfully!");
  console.log(`\n📋 Model → Zone Mapping:`);
  console.log(`   anime     → qwen-image-edit (Anime Art Agent)`);
  console.log(`   portrait  → wanx-v3 (Portrait Studio Agent)`);
  console.log(`   landscape → wanx-v3 (Landscape Explorer Agent)`);
  console.log(`   creative  → qwen-image-edit (Creative Vision Agent)`);
  console.log(`   product   → wanx-v3 (Product Studio Agent)`);
  console.log(`   (all)     → qwen-image-plus (fallback high-quality)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());