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
  anime: {
    id: "anime",
    name: "Anime",
    subtitle: "Anime Style Generation",
    description: "Generate beautiful anime-style artwork with support for various manga styles, from Japanese kawaii to shonen action",
    icon: "Palette",
    gradient: "from-pink-500 to-purple-600",
    accentColor: "pink",
    systemPrompt:
      "anime style, high quality anime illustration, vibrant colors, clean lines, detailed anime art, beautiful anime character, studio quality anime,",
    negativeSystemPrompt:
      "realistic, photo, 3d render, low quality, blurry, deformed, ugly, bad anatomy,",
    defaultModel: "seedream_50",
    availableModels: [
      { id: "seedream_50", name: "Seedream 5.0" },
      { id: "nano_banana_2", name: "Nano Banana 2" },
      { id: "genesis_basic", name: "Genesis Basic" },
    ],
    useCases: [
      {
        title: "Anime Character Design",
        prompt: "a beautiful anime girl with long silver hair and blue eyes, wearing a school uniform, cherry blossom background, soft lighting",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
      },
      {
        title: "Epic Battle Scene",
        prompt: "epic anime battle scene, warrior with glowing sword, dramatic action pose, energy effects, dark stormy sky",
        image: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&h=300&fit=crop",
      },
      {
        title: "Japanese School Life",
        prompt: "peaceful anime school scene, students under cherry blossom tree, golden hour lighting, warm atmosphere",
        image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop",
      },
      {
        title: "Cyberpunk Anime",
        prompt: "cyberpunk anime girl in neon-lit city street, futuristic outfit, holographic displays, rain reflections",
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

  portrait: {
    id: "portrait",
    name: "Portrait",
    subtitle: "Portrait Enhancement",
    description: "Professional portrait photo generation and enhancement, supporting ID photos, artistic portraits, fashion photography and more",
    icon: "Camera",
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "blue",
    systemPrompt:
      "professional portrait photography, studio lighting, high quality, detailed skin texture, natural skin tone, professional retouching, shallow depth of field, bokeh,",
    negativeSystemPrompt:
      "anime, cartoon, illustration, painting, low quality, blurry, deformed face, bad anatomy, extra limbs,",
    defaultModel: "seedream_50",
    availableModels: [
      { id: "seedream_50", name: "Seedream 5.0" },
      { id: "nano_banana_pro", name: "Nano Banana Pro" },
      { id: "qwen_image", name: "Qwen-Image" },
    ],
    useCases: [
      {
        title: "Professional Headshot",
        prompt: "professional headshot photo, business attire, neutral background, soft studio lighting, confident expression",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      },
      {
        title: "Fashion Editorial",
        prompt: "fashion portrait, editorial style, dramatic lighting, stylish outfit, urban background, magazine quality",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop",
      },
      {
        title: "Natural Light Portrait",
        prompt: "natural light portrait, golden hour, outdoor setting, warm tones, relaxed pose, bokeh background",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop",
      },
      {
        title: "Creative Art Portrait",
        prompt: "creative portrait, double exposure effect, silhouette with nature overlay, artistic composition",
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

  landscape: {
    id: "landscape",
    name: "Landscape",
    subtitle: "Landscape Enhancement",
    description: "Generate stunning landscape photography, supporting natural scenery, cityscapes, fantasy scenes and more",
    icon: "Mountain",
    gradient: "from-green-500 to-teal-600",
    accentColor: "green",
    systemPrompt:
      "professional landscape photography, ultra detailed, dramatic composition, golden hour lighting, high dynamic range, 8k quality, national geographic style,",
    negativeSystemPrompt:
      "people, portrait, anime, cartoon, low quality, blurry, overexposed, flat lighting,",
    defaultModel: "seedream_50",
    availableModels: [
      { id: "seedream_50", name: "Seedream 5.0" },
      { id: "genesis_basic", name: "Genesis Basic" },
      { id: "nano_banana_2", name: "Nano Banana 2" },
    ],
    useCases: [
      {
        title: "Sunrise Mountains",
        prompt: "majestic mountain range at sunrise, golden light on snow-capped peaks, misty valleys below, dramatic clouds",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      },
      {
        title: "City Nightscape",
        prompt: "breathtaking city skyline at night, neon lights reflecting on river, long exposure, urban landscape photography",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
      },
      {
        title: "Tropical Beach",
        prompt: "tropical paradise beach, crystal clear turquoise water, palm trees, white sand, aerial view",
        image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop",
      },
      {
        title: "Enchanted Forest",
        prompt: "enchanted forest with bioluminescent plants, magical atmosphere, fog, sunbeams through trees, fantasy landscape",
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

  creative: {
    id: "creative",
    name: "Creative",
    subtitle: "Creative Art",
    description: "Unleash your imagination with creative art generation, supporting oil painting, watercolor, digital art, surrealism and more",
    icon: "Lightbulb",
    gradient: "from-purple-500 to-violet-600",
    accentColor: "purple",
    systemPrompt:
      "creative digital art, artistic interpretation, unique composition, expressive brushstrokes, imaginative concept, masterpiece quality, trending on artstation,",
    negativeSystemPrompt:
      "photorealistic, photo, ordinary, boring, low quality, blurry, watermark, text,",
    defaultModel: "nano_banana_pro",
    availableModels: [
      { id: "nano_banana_pro", name: "Nano Banana Pro" },
      { id: "seedream_50", name: "Seedream 5.0" },
      { id: "qwen_image", name: "Qwen-Image" },
    ],
    useCases: [
      {
        title: "Surrealism",
        prompt: "surrealist painting, melting clocks in desert landscape, impossible architecture, dreamlike atmosphere, salvador dali inspired",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
      },
      {
        title: "Oil Painting",
        prompt: "oil painting style, impressionist landscape, thick brushstrokes, vibrant colors, monet inspired garden scene",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop",
      },
      {
        title: "Digital Illustration",
        prompt: "digital illustration, futuristic concept art, floating islands, bioluminescent creatures, fantasy world",
        image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop",
      },
      {
        title: "Abstract Art",
        prompt: "abstract art, flowing geometric shapes, bold color palette, dynamic composition, modern art gallery quality",
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

  product: {
    id: "product",
    name: "Product",
    subtitle: "Product Photography",
    description: "Professional e-commerce product image generation, supporting white background, lifestyle, model showcase and more",
    icon: "ShoppingBag",
    gradient: "from-orange-500 to-red-500",
    accentColor: "orange",
    systemPrompt:
      "professional product photography, clean background, studio lighting, commercial quality, sharp focus, color accurate, e-commerce ready,",
    negativeSystemPrompt:
      "blurry, low quality, watermark, text overlay, cluttered background, poor lighting, overexposed,",
    defaultModel: "nano_banana_pro",
    availableModels: [
      { id: "nano_banana_pro", name: "Nano Banana Pro" },
      { id: "seedream_50", name: "Seedream 5.0" },
      { id: "genesis_basic", name: "Genesis Basic" },
    ],
    useCases: [
      {
        title: "White Background Product",
        prompt: "professional product photo on pure white background, studio lighting, no shadows, e-commerce standard, skincare bottle",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
      },
      {
        title: "Lifestyle Scene",
        prompt: "lifestyle product photography, coffee beans and cup on wooden table, warm morning light, cozy atmosphere, flat lay",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
      },
      {
        title: "Food Photography",
        prompt: "professional food photography, gourmet dish, dramatic side lighting, shallow depth of field, restaurant quality presentation",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
      },
      {
        title: "Tech Product",
        prompt: "tech product photography, sleek headphones on gradient background, dramatic rim lighting, premium feel, minimal composition",
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