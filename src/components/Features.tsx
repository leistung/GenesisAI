"use client";

import { Sparkles, Zap, Text, Shield, Palette, Bolt } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Zero-Cost Creation",
    description: "The world's first completely free AI image generator with no generation count limits or registration requirements.",
  },
  {
    icon: Zap,
    title: "State-of-the-Art Quality",
    description: "Scene-aware intelligent routing picks the best available model to deliver photorealistic images with exceptional detail.",
  },
  {
    icon: Text,
    title: "Advanced Text Understanding",
    description: "Superior text-to-image capabilities with accurate interpretation of complex prompts and text overlay features.",
  },
  {
    icon: Bolt,
    title: "Lightning-Fast Generation",
    description: "An optimized inference pipeline delivers rapid image generation without compromising quality.",
  },
  {
    icon: Shield,
    title: "Enhanced Privacy Protection",
    description: "Minimal data collection approach - guest requests are processed temporarily.",
  },
  {
    icon: Palette,
    title: "Multi-Style Support",
    description: "Create images across various artistic styles, from photorealistic to anime, oil paintings to digital art.",
  },
];

export default function Features() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Key Features of GenesisAI Image Generator
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience the next generation of AI image generation with the GenesisAI Image Generator — powerful, free and privacy-focused.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Advanced Features Banner */}
      <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Advanced Features of GenesisAI Image Generator
            </h3>
            <p className="text-purple-100 text-lg">
              Experience the power of GenesisAI Image Generator with advanced AI creation and editing tools
            </p>
          </div>
          <div className="flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
              alt="AI generated art"
              className="rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Trusted by Millions
        </h3>
        <p className="text-gray-600 text-lg">
          Join the world&apos;s largest free AI Image Generator community
        </p>
      </div>
    </div>
  );
}
