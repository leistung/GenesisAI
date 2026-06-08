import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const models = [
    {
      name: "qwen-image-edit",
      displayName: "Qwen Image Edit",
      provider: "dashscope",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: "sk-bf6f4e487bf24b31bcf02dc17d50c4ca",
      modelId: "qwen-image-edit",
      creditsCost: 1,
      isActive: true,
      sortOrder: 0,
      supportsTextToImage: true,
      supportsImageEdit: true,
      supportsNegativePrompt: true,
      maxPromptLength: 2000,
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      stylePrompts: JSON.stringify({
        anime: "anime style, manga art, vibrant colors, detailed illustration",
        portrait: "professional portrait photography, studio lighting, detailed face",
        landscape: "breathtaking landscape photography, golden hour, dramatic sky",
        creative: "creative digital art, surreal, artistic, imaginative composition",
        product: "professional product photography, clean background, studio lighting",
      }),
    },
    {
      name: "wanx-v3",
      displayName: "Wanx v3",
      provider: "dashscope",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: "sk-bf6f4e487bf24b31bcf02dc17d50c4ca",
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
        anime: "anime style, manga art, vibrant colors, detailed illustration",
        portrait: "professional portrait photography, studio lighting, detailed face",
        landscape: "breathtaking landscape photography, golden hour, dramatic sky",
        creative: "creative digital art, surreal, artistic, imaginative composition",
        product: "professional product photography, clean background, studio lighting",
      }),
    },
  ];

  for (const model of models) {
    await prisma.aIModel.upsert({
      where: { name: model.name },
      update: model,
      create: model,
    });
    console.log(`Seeded model: ${model.name}`);
  }

  console.log("AI models seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
