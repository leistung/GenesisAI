export interface StyleConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  accentColor: string;
  systemPrompt: string;
  negativeSystemPrompt: string;
  defaultModel: string;
  availableModels: { id: string; name: string }[];
  useCases: { title: string; prompt: string; image: string }[];
  tips: string[];
}

export const styleConfigs: Record<string, StyleConfig> = {
  // ============================================================
  // 分区1: 动漫专区 — Agent: qwen-image-edit
  // ============================================================
  anime: {
    id: "anime",
    name: "Anime",
    subtitle: "Anime Style Generation",
    description:
      "Generate beautiful anime-style artwork with support for various manga styles, from Japanese kawaii to shonen action",
    icon: "Palette",
    gradient: "from-pink-500 to-purple-600",
    accentColor: "pink",
    systemPrompt:
      "masterpiece, best quality, ultra detailed, anime style, vibrant colors, clean lineart, beautiful anime illustration, studio quality anime, cel shaded, soft shading, expressive eyes, dynamic pose, professional anime art, trending on pixiv,",
    negativeSystemPrompt:
      "realistic, photo, photograph, 3d render, cgi, low quality, worst quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, watermark, text, signature, sketch,",
    defaultModel: "qwen-image-edit",
    availableModels: [
      { id: "qwen-image-edit", name: "Qwen Image Edit" },
      { id: "wanx-v3", name: "Wanx v3" },
      { id: "qwen-image-plus", name: "Qwen Image Plus" },
    ],
    useCases: [
      {
        title: "Anime Character Design",
        prompt:
          "a beautiful anime girl with long silver hair and blue eyes, wearing a school uniform, cherry blossom background, soft lighting, sakura petals falling",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
      },
      {
        title: "Epic Battle Scene",
        prompt:
          "epic anime battle scene, warrior with glowing sword, dramatic action pose, energy effects, dark stormy sky, motion blur, particle effects",
        image: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&h=300&fit=crop",
      },
      {
        title: "Japanese School Life",
        prompt:
          "peaceful anime school scene, students under cherry blossom tree, golden hour lighting, warm atmosphere, petals in the wind, nostalgic mood",
        image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop",
      },
      {
        title: "Cyberpunk Anime",
        prompt:
          "cyberpunk anime girl in neon-lit city street, futuristic outfit, holographic displays, rain reflections, volumetric lighting, night scene",
        image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop",
      },
    ],
    tips: [
      "Add specific art style keywords like 'shinkai style' or 'ghibli style' to your prompt",
      "Use 'detailed eyes', 'beautiful face' to enhance character details",
      "Add 'soft lighting', 'bloom effect' for better anime lighting",
      "Try different mood keywords: 'peaceful', 'dramatic', 'melancholic'",
    ],
  },

  // ============================================================
  // 分区2: 肖像专区 — Agent: wanx-v3
  // ============================================================
  portrait: {
    id: "portrait",
    name: "Portrait",
    subtitle: "Portrait Enhancement",
    description:
      "Professional portrait photo generation and enhancement, supporting ID photos, artistic portraits, fashion photography and more",
    icon: "Camera",
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "blue",
    systemPrompt:
      "masterpiece, best quality, ultra detailed, professional portrait photography, studio lighting, 8k, high resolution, detailed skin texture, natural skin tone, professional retouching, sharp focus, shallow depth of field, bokeh background, magazine quality, fashion photography,",
    negativeSystemPrompt:
      "anime, cartoon, illustration, painting, sketch, low quality, worst quality, blurry, deformed face, bad anatomy, extra limbs, missing limbs, distorted, ugly, watermark, text, signature, grainy, oversaturated,",
    defaultModel: "wanx-v3",
    availableModels: [
      { id: "wanx-v3", name: "Wanx v3" },
      { id: "qwen-image-edit", name: "Qwen Image Edit" },
      { id: "qwen-image-plus", name: "Qwen Image Plus" },
    ],
    useCases: [
      {
        title: "Professional Headshot",
        prompt:
          "professional headshot photo, business attire, neutral background, soft studio lighting, confident expression, corporate portrait",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      },
      {
        title: "Fashion Editorial",
        prompt:
          "fashion portrait, editorial style, dramatic lighting, stylish outfit, urban background, magazine quality, haute couture",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop",
      },
      {
        title: "Natural Light Portrait",
        prompt:
          "natural light portrait, golden hour, outdoor setting, warm tones, relaxed pose, bokeh background, candid photography",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop",
      },
      {
        title: "Creative Art Portrait",
        prompt:
          "creative portrait, double exposure effect, silhouette with nature overlay, artistic composition, ethereal mood",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      },
    ],
    tips: [
      "Upload a reference photo to better control the portrait style",
      "Use 'professional retouching' keyword for polished results",
      "Add 'shallow depth of field' for professional background blur",
      "Try different lighting: 'rembrandt lighting', 'butterfly lighting', 'ring light'",
    ],
  },

  // ============================================================
  // 分区3: 风景专区 — Agent: wanx-v3
  // ============================================================
  landscape: {
    id: "landscape",
    name: "Landscape",
    subtitle: "Landscape Enhancement",
    description:
      "Generate stunning landscape photography, supporting natural scenery, cityscapes, fantasy scenes and more",
    icon: "Mountain",
    gradient: "from-green-500 to-teal-600",
    accentColor: "green",
    systemPrompt:
      "masterpiece, best quality, ultra detailed, professional landscape photography, 8k, high resolution, dramatic composition, golden hour lighting, high dynamic range, national geographic style, breathtaking scenery, sharp focus, wide angle, atmospheric,",
    negativeSystemPrompt:
      "people, person, portrait, anime, cartoon, illustration, low quality, worst quality, blurry, overexposed, underexposed, flat lighting, watermark, text, signature, distorted,",
    defaultModel: "wanx-v3",
    availableModels: [
      { id: "wanx-v3", name: "Wanx v3" },
      { id: "qwen-image-edit", name: "Qwen Image Edit" },
      { id: "qwen-image-plus", name: "Qwen Image Plus" },
    ],
    useCases: [
      {
        title: "Sunrise Mountains",
        prompt:
          "majestic mountain range at sunrise, golden light on snow-capped peaks, misty valleys below, dramatic clouds, ultra wide angle",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      },
      {
        title: "City Nightscape",
        prompt:
          "breathtaking city skyline at night, neon lights reflecting on river, long exposure, urban landscape photography, cyberpunk aesthetic",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
      },
      {
        title: "Tropical Beach",
        prompt:
          "tropical paradise beach, crystal clear turquoise water, palm trees, white sand, aerial drone view, summer vibes",
        image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop",
      },
      {
        title: "Enchanted Forest",
        prompt:
          "enchanted forest with bioluminescent plants, magical atmosphere, fog, sunbeams through trees, fantasy landscape, ethereal glow",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
      },
    ],
    tips: [
      "Use 'golden hour' or 'blue hour' keywords to control lighting",
      "Add 'aerial view' or 'drone shot' for aerial perspectives",
      "Try 'long exposure' for silky water and light trail effects",
      "Use '8k', 'ultra detailed' to enhance image clarity",
    ],
  },

  // ============================================================
  // 分区4: 创意专区 — Agent: qwen-image-edit
  // ============================================================
  creative: {
    id: "creative",
    name: "Creative",
    subtitle: "Creative Art",
    description:
      "Unleash your imagination with creative art generation, supporting oil painting, watercolor, digital art, surrealism and more",
    icon: "Lightbulb",
    gradient: "from-purple-500 to-violet-600",
    accentColor: "purple",
    systemPrompt:
      "masterpiece, best quality, ultra detailed, creative digital art, artistic interpretation, unique composition, expressive brushstrokes, imaginative concept, trending on artstation, behance, vivid colors, conceptual art, gallery quality,",
    negativeSystemPrompt:
      "photorealistic, photo, photograph, ordinary, boring, mundane, low quality, worst quality, blurry, watermark, text, signature, simple background, plain,",
    defaultModel: "qwen-image-edit",
    availableModels: [
      { id: "qwen-image-edit", name: "Qwen Image Edit" },
      { id: "wanx-v3", name: "Wanx v3" },
      { id: "qwen-image-plus", name: "Qwen Image Plus" },
    ],
    useCases: [
      {
        title: "Surrealism",
        prompt:
          "surrealist painting, melting clocks in desert landscape, impossible architecture, dreamlike atmosphere, salvador dali inspired, mind-bending perspective",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
      },
      {
        title: "Oil Painting",
        prompt:
          "oil painting style, impressionist landscape, thick impasto brushstrokes, vibrant colors, monet inspired garden scene, canvas texture",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop",
      },
      {
        title: "Digital Illustration",
        prompt:
          "digital illustration, futuristic concept art, floating islands, bioluminescent creatures, fantasy world, matte painting, epic scale",
        image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop",
      },
      {
        title: "Abstract Art",
        prompt:
          "abstract art, flowing geometric shapes, bold color palette, dynamic composition, modern art gallery quality, contemporary aesthetic",
        image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop",
      },
    ],
    tips: [
      "Try mixing multiple art style keywords like 'oil painting meets digital art'",
      "Use 'trending on artstation' to boost artistic quality",
      "Add specific artist style references like 'in the style of Monet'",
      "Use 'concept art', 'matte painting' for professional results",
    ],
  },

  // ============================================================
  // 分区5: 产品专区 — Agent: wanx-v3
  // ============================================================
  product: {
    id: "product",
    name: "Product",
    subtitle: "Product Photography",
    description:
      "Professional e-commerce product image generation, supporting white background, lifestyle, model showcase and more",
    icon: "ShoppingBag",
    gradient: "from-orange-500 to-red-500",
    accentColor: "orange",
    systemPrompt:
      "masterpiece, best quality, ultra detailed, professional product photography, clean background, studio lighting, commercial quality, sharp focus, color accurate, e-commerce ready, premium feel, luxury, minimal composition, soft shadows, 8k,",
    negativeSystemPrompt:
      "blurry, low quality, worst quality, watermark, text overlay, logo, cluttered background, messy, poor lighting, overexposed, underexposed, distorted, deformed, grainy, noisy,",
    defaultModel: "wanx-v3",
    availableModels: [
      { id: "wanx-v3", name: "Wanx v3" },
      { id: "qwen-image-edit", name: "Qwen Image Edit" },
      { id: "qwen-image-plus", name: "Qwen Image Plus" },
    ],
    useCases: [
      {
        title: "White Background Product",
        prompt:
          "professional product photo on pure white background, studio lighting, no shadows, e-commerce standard, skincare bottle, premium packaging",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
      },
      {
        title: "Lifestyle Scene",
        prompt:
          "lifestyle product photography, coffee beans and cup on wooden table, warm morning light, cozy atmosphere, flat lay, rustic aesthetic",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
      },
      {
        title: "Food Photography",
        prompt:
          "professional food photography, gourmet dish, dramatic side lighting, shallow depth of field, restaurant quality presentation, steam rising",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
      },
      {
        title: "Tech Product",
        prompt:
          "tech product photography, sleek headphones on gradient background, dramatic rim lighting, premium feel, minimal composition, modern design",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
      },
    ],
    tips: [
      "Use 'pure white background' for standard e-commerce shots",
      "Add 'studio lighting', 'soft box lighting' to control illumination",
      "Use 'flat lay' keyword for overhead product shots",
      "Add 'premium feel', 'luxury' to elevate product perception",
    ],
  },
};

// ============================================================
// 分区 Agent 映射表
// 每个分区对应一个最佳 AI 模型 (Agent)
// ============================================================
export const zoneAgentMapping: Record<string, {
  agentName: string;
  modelName: string;
  description: string;
}> = {
  anime: {
    agentName: "Anime Art Agent",
    modelName: "qwen-image-edit",
    description: "专门优化日系动漫风格，支持角色设计、战斗场景、校园生活等多种动漫类型",
  },
  portrait: {
    agentName: "Portrait Studio Agent",
    modelName: "wanx-v3",
    description: "专业人像摄影 Agent，支持证件照、时尚摄影、艺术肖像等多种人像风格",
  },
  landscape: {
    agentName: "Landscape Explorer Agent",
    modelName: "wanx-v3",
    description: "专业风景摄影 Agent，支持自然风光、城市夜景、奇幻场景等",
  },
  creative: {
    agentName: "Creative Vision Agent",
    modelName: "qwen-image-edit",
    description: "创意艺术 Agent，支持油画、水彩、数字艺术、超现实主义等多种艺术形式",
  },
  product: {
    agentName: "Product Studio Agent",
    modelName: "wanx-v3",
    description: "专业电商产品摄影 Agent，支持白底图、场景图、美食摄影等",
  },
};