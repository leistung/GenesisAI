"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Upload,
  X,
  Shuffle,
  Zap,
  Image as ImageIcon,
  ChevronDown,
  Wand2,
  Loader2,
  User,
  LogOut,
  Coins,
  Crown,
} from "lucide-react";

const models = [
  { id: "genesis_basic", name: "Genesis Basic", description: "Balanced quality and speed" },
  { id: "nano_banana_2", name: "Nano Banana 2", description: "High quality with 🍌 style" },
  { id: "nano_banana_pro", name: "Nano Banana Pro", description: "Professional grade output" },
  { id: "qwen_image", name: "Qwen-Image", description: "Advanced text understanding" },
  { id: "seedream_50", name: "Seedream 5.0", description: "State-of-the-art quality" },
];

const aspectRatios = [
  { id: "1:1", name: "1:1", description: "Square" },
  { id: "16:9", name: "16:9", description: "Widescreen" },
  { id: "9:16", name: "9:16", description: "Portrait" },
  { id: "4:3", name: "4:3", description: "Standard" },
  { id: "3:4", name: "3:4", description: "Portrait Standard" },
];

const styleOptions = [
  { id: "none", name: "No Style" },
  { id: "photorealistic", name: "Photorealistic" },
  { id: "anime", name: "Anime" },
  { id: "digital_art", name: "Digital Art" },
  { id: "oil_painting", name: "Oil Painting" },
];

const colorOptions = [
  { id: "none", name: "No Color" },
  { id: "vibrant", name: "Vibrant" },
  { id: "muted", name: "Muted" },
  { id: "monochrome", name: "Monochrome" },
  { id: "pastel", name: "Pastel" },
];

const lightingOptions = [
  { id: "none", name: "No Lighting" },
  { id: "soft", name: "Soft" },
  { id: "dramatic", name: "Dramatic" },
  { id: "natural", name: "Natural" },
  { id: "studio", name: "Studio" },
];

const compositionOptions = [
  { id: "none", name: "No Composition" },
  { id: "centered", name: "Centered" },
  { id: "rule_of_thirds", name: "Rule of Thirds" },
  { id: "wide_angle", name: "Wide Angle" },
  { id: "close_up", name: "Close Up" },
];

const randomPrompts = [
  "A futuristic cityscape at sunset with flying cars",
  "A mystical forest with glowing mushrooms and fairies",
  "An astronaut riding a horse on Mars",
  "A steampunk-inspired coffee shop interior",
  "A dragon made of clouds and lightning",
  "A cyberpunk street market at night",
  "A serene Japanese garden with cherry blossoms",
  "A vintage car driving through a neon-lit tunnel",
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export default function ImageGenerator() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0]);
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedLighting, setSelectedLighting] = useState(lightingOptions[0]);
  const [selectedComposition, setSelectedComposition] = useState(compositionOptions[0]);
  const [fastMode, setFastMode] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user credits
  useEffect(() => {
    if (session?.user) {
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
  };

  const handleClear = () => {
    setPrompt("");
    setGeneratedImage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // SSE-based image generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationStatus("Starting generation...");
    setGenerationProgress(0);
    setGeneratedImage(null);
    setGenerationError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model: selectedModel.id,
          aspectRatio: selectedRatio.id,
          style: selectedStyle.id,
          color: selectedColor.id,
          lighting: selectedLighting.id,
          composition: selectedComposition.id,
          fastMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.status) {
              case "started":
                setGenerationStatus(data.message);
                setGenerationProgress(5);
                break;
              case "processing":
                setGenerationStatus(data.message);
                setGenerationProgress(data.progress || 50);
                break;
              case "completed":
                setGenerationStatus(data.message);
                setGenerationProgress(100);
                setGeneratedImage(data.image);
                // Refresh credits
                if (session?.user) {
                  const creditsRes = await fetch("/api/credits");
                  const creditsData = await creditsRes.json();
                  if (creditsData.credits !== undefined) {
                    setCredits(creditsData.credits);
                  }
                }
                break;
              case "error":
                throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Skip invalid JSON
              continue;
            }
            throw e;
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      const errorMsg = error instanceof Error ? error.message : "Generation failed";
      setGenerationStatus(errorMsg);
      setGenerationError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
              AI Image Generator
            </h2>
            <div className="flex items-center gap-3">
              {/* Credits Display */}
              {session?.user && credits !== null && (
                <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full text-sm">
                  <Coins className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-medium">{credits} credits</span>
                </div>
              )}
              
              {/* User Menu */}
              {status === "authenticated" ? (
                <div className="flex items-center gap-2">
                  {session.user.subscriptionTier && session.user.subscriptionTier !== "free" && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
              
              {/* Model Selector */}
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Model: {selectedModel.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Model Dropdown */}
          {showModelDropdown && (
            <div className="absolute right-8 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedModel.id === model.id ? "bg-purple-50" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">{model.name}</div>
                  <div className="text-sm text-gray-500">{model.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Reference Image Upload */}
          <div className="mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Upload reference image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {referenceImage && (
              <div className="mt-2 relative inline-block">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleClear}
              disabled={!prompt}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Clear
            </button>
            <button
              onClick={handleRandomPrompt}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shuffle className="w-4 h-4 inline mr-1" />
              Random
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Aspect Ratio */}
            <select
              value={selectedRatio.id}
              onChange={(e) => {
                const ratio = aspectRatios.find((r) => r.id === e.target.value);
                if (ratio) setSelectedRatio(ratio);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.name}
                </option>
              ))}
            </select>

            {/* Style */}
            <select
              value={selectedStyle.id}
              onChange={(e) => {
                const style = styleOptions.find((s) => s.id === e.target.value);
                if (style) setSelectedStyle(style);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>

            {/* Color */}
            <select
              value={selectedColor.id}
              onChange={(e) => {
                const color = colorOptions.find((c) => c.id === e.target.value);
                if (color) setSelectedColor(color);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {colorOptions.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>

            {/* Lighting */}
            <select
              value={selectedLighting.id}
              onChange={(e) => {
                const lighting = lightingOptions.find((l) => l.id === e.target.value);
                if (lighting) setSelectedLighting(lighting);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {lightingOptions.map((lighting) => (
                <option key={lighting.id} value={lighting.id}>
                  {lighting.name}
                </option>
              ))}
            </select>

            {/* Composition */}
            <select
              value={selectedComposition.id}
              onChange={(e) => {
                const composition = compositionOptions.find((c) => c.id === e.target.value);
                if (composition) setSelectedComposition(composition);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {compositionOptions.map((composition) => (
                <option key={composition.id} value={composition.id}>
                  {composition.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fastMode}
                onChange={(e) => setFastMode(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                Fast Mode
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNegativePrompt}
                onChange={(e) => setShowNegativePrompt(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Negative Prompt</span>
            </label>
          </div>

          {/* Negative Prompt Input */}
          {showNegativePrompt && (
            <div className="mb-4">
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What you don't want in the image..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {generationStatus}
                {generationProgress > 0 && (
                  <span className="ml-2 text-sm">({generationProgress}%)</span>
                )}
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Generate{fastMode ? " (Fast)" : ""}
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isGenerating && generationProgress > 0 && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {generationError && !isGenerating && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Generation Failed</p>
              <p className="text-sm text-red-600 mt-1">{generationError}</p>
            </div>
          )}
        </div>

        {/* Generated Image */}
        {generatedImage && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Image</h3>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={generatedImage.url}
                alt={generatedImage.prompt}
                className="w-full h-auto"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">{generatedImage.prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
