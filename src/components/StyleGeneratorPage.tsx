"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Upload,
  X,
  Shuffle,
  Zap,
  Image as ImageIcon,
  Wand2,
  Loader2,
  Coins,
  Heart,
  Bookmark as BookmarkIcon,
  Share2,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Sparkles,
  Download,
  Layers,
  Eye,
  SlidersHorizontal,
  Stars,
  Palette,
  ArrowRight,
  Play,
} from "lucide-react";
import Link from "next/link";
import { StyleConfig } from "@/lib/styles";

const aspectRatios = [
  { id: "1:1", name: "1:1", desc: "Square" },
  { id: "16:9", name: "16:9", desc: "Widescreen" },
  { id: "9:16", name: "9:16", desc: "Portrait" },
  { id: "4:3", name: "4:3", desc: "Standard" },
  { id: "3:4", name: "3:4", desc: "Vertical" },
];

interface CommunityWork {
  id: string;
  imageUrl: string;
  prompt: string;
  author: string;
  likes: number;
}

interface StyleGeneratorPageProps {
  style: StyleConfig;
}

export default function StyleGeneratorPage({ style }: StyleGeneratorPageProps) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(style.availableModels[0]);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<{ id: string; url: string; prompt: string } | null>(null);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [communityWorks, setCommunityWorks] = useState<CommunityWork[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [likedWorks, setLikedWorks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(console.error);
    }
    fetchCommunityWorks();
  }, [session]);

  async function fetchCommunityWorks() {
    try {
      const res = await fetch(`/api/images?style=${style.id}&public=true&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setCommunityWorks(data.images || []);
      }
    } catch {
      const mockWorks: CommunityWork[] = Array.from({ length: 8 }, (_, i) => ({
        id: `mock-${i}`,
        imageUrl: `https://picsum.photos/seed/${style.id}${i}/400/400`,
        prompt: style.useCases[i % style.useCases.length].prompt,
        author: `Creator${i + 1}`,
        likes: Math.floor(Math.random() * 500) + 50,
      }));
      setCommunityWorks(mockWorks);
    }
  }

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * style.useCases.length);
    setPrompt(style.useCases[randomIndex].prompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStatus("Initializing...");
    setGenerationProgress(0);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          negativePrompt: negativePrompt || undefined,
          model: selectedModel.id,
          aspectRatio: selectedRatio.id,
          style: style.id,
          fastMode: false,
          referenceImage: referenceImage || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

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
                if (session?.user) {
                  const creditsRes = await fetch("/api/credits");
                  const creditsData = await creditsRes.json();
                  if (creditsData.credits !== undefined) setCredits(creditsData.credits);
                }
                break;
              case "error":
                throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (error) {
      setGenerationStatus(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-${generatedImage.prompt.slice(0, 30).replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handlePublish = async () => {
    if (!generatedImage || !session?.user) return;
    setPublishing(true);
    try {
      await fetch(`/api/images/${generatedImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      fetchCommunityWorks();
    } catch (error) {
      console.error("Publish failed:", error);
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (imageId: string) => {
    if (!session?.user) return;
    try {
      const res = await fetch(`/api/v1/images/${imageId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCommunityWorks((prev) =>
          prev.map((w) => (w.id === imageId ? { ...w, likes: data.likes } : w))
        );
        setLikedWorks((prev) => {
          const next = new Set(prev);
          if (data.liked) next.add(imageId); else next.delete(imageId);
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-[0.03]`} />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-tl from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-400/5 to-rose-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full" style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">{style.name}</span>
          </div>

          {/* Title area */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                    {style.name}
                    <span className={`ml-3 text-sm font-normal px-3 py-1 rounded-full bg-gradient-to-r ${style.gradient} text-white`}>
                      AI
                    </span>
                  </h1>
                  <p className="text-gray-500 mt-0.5">{style.subtitle}</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{style.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {session?.user && credits !== null && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Available Credits</div>
                    <div className="text-sm font-bold text-gray-900">{credits}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== GENERATOR PANEL ===== */}
          <div className="lg:col-span-2">
            <div className="relative bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                      <Wand2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">AI {style.name} Generator</h2>
                      <p className="text-xs text-gray-500">Describe your idea, AI brings it to life</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                      showAdvanced
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Advanced Options
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Reference Image Upload */}
                {referenceImage ? (
                  <div className="mb-5 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                    <div className="flex items-start gap-3">
                      <div className="relative group">
                        <img src={referenceImage} alt="Reference" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                        <button
                          onClick={() => setReferenceImage(null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Reference image uploaded</div>
                        <p className="text-xs text-gray-500 mt-1">AI will generate using the reference image and prompt</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-5 w-full h-20 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50/50 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Upload Reference Image</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                {/* Prompt Input */}
                <div className="mb-4">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Describe the ${style.name}image...`}
                      className="w-full h-32 px-5 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all resize-none placeholder:text-gray-400"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={handleRandomPrompt}
                        className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
                        title="Inspiration"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                      className={`text-xs flex items-center gap-1 transition-colors ${
                        showNegativePrompt ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      Negative Prompt
                    </button>
                    <span className="text-xs text-gray-400">{prompt.length}/2000</span>
                  </div>

                  {showNegativePrompt && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="Things you don't want to see..."
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">AI Model</label>
                        <select
                          value={selectedModel.id}
                          onChange={(e) => {
                            const model = style.availableModels.find((m) => m.id === e.target.value);
                            if (model) setSelectedModel(model);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                          {style.availableModels.map((model) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Aspect Ratio</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {aspectRatios.map((ratio) => (
                            <button
                              key={ratio.id}
                              onClick={() => setSelectedRatio(ratio)}
                              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                                selectedRatio.id === ratio.id
                                  ? "border-purple-500 bg-purple-50 text-purple-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {ratio.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Style Enhance</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-gray-600">{style.name} style enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Model Selection */}
                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                  {style.availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all border ${
                        selectedModel.id === model.id
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      {model.name}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={`relative w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${
                    prompt.trim()
                      ? `bg-gradient-to-r ${style.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                      : "bg-gray-300"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {generationStatus}
                        {generationProgress > 0 && (
                          <span className="text-sm opacity-75">({generationProgress}%)</span>
                        )}
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start Generating
                      </>
                    )}
                  </span>
                </button>

                {/* Progress Bar */}
                {isGenerating && generationProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Generation Progress</span>
                      <span className="text-xs font-medium text-gray-700">{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${style.gradient} h-full rounded-full transition-all duration-500 relative`}
                        style={{ width: `${generationProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Result */}
                {generatedImage && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Stars className="w-5 h-5 text-yellow-500" />
                        Generated Result
                      </h3>
                      <div className="flex items-center gap-2">
                        {session?.user && (
                          <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-md disabled:opacity-50"
                          >
                            <Share2 className="w-4 h-4" />
                            {publishing ? "Publishing..." : "Publish to Community"}
                          </button>
                        )}
                        <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                      <img
                        src={generatedImage.url}
                        alt={generatedImage.prompt}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
                    </div>
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      {prompt}
                    </p>
                    {!session?.user && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 text-center">
                        <p className="text-sm text-gray-600 mb-2">Sign in to publish your work to the community</p>
                        <Link
                          href="/signin"
                          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-md inline-block"
                        >
                          Sign In Now
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-6">
            {/* Tips Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
              <div className={`px-5 py-4 bg-gradient-to-r ${style.gradient}`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Creative Tips
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-4">
                  {style.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${style.gradient} text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Style Info Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  About {style.name}
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 leading-relaxed">{style.description}</p>
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      {style.name} Style Enhance is automatically applied, just describe what you want
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Models */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Supported Models
                </h3>
              </div>
              <div className="p-5 space-y-2">
                {style.availableModels.map((model) => (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                      selectedModel.id === model.id
                        ? "bg-purple-50 border border-purple-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <span className="text-gray-700">{model.name}</span>
                    {selectedModel.id === model.id && (
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== USE CASES ===== */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inspiration</h2>
              <p className="text-gray-500 mt-1">Click a case to fill in the prompt and start creating</p>
            </div>
            <Link
              href="/pricing"
              className="hidden sm:flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              Upgrade to unlock more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {style.useCases.map((useCase, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(useCase.prompt)}
                className="group relative text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:border-purple-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={useCase.image}
                    alt={useCase.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                      <Play className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg">
                      {useCase.title}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{useCase.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ===== COMMUNITY ===== */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Community Works</h2>
              <p className="text-gray-500 mt-1">{style.name} works from other creators</p>
            </div>
          </div>

          {communityWorks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {communityWorks.map((work, idx) => (
                <div
                  key={work.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
                >
                  <img
                    src={work.imageUrl}
                    alt={work.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-xs line-clamp-2 mb-3 leading-relaxed">{work.prompt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {work.author[0]}
                          </div>
                          <span className="text-xs text-white/80">{work.author}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleLike(work.id); }}
                          className="flex items-center gap-1 text-white/80 hover:text-red-400 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedWorks.has(work.id) ? "fill-current text-red-400" : ""}`} />
                          <span className="text-xs">{work.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Ranking badge */}
                  {idx < 3 && (
                    <div className="absolute top-3 left-3">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                        {idx + 1}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500">No community works yet, be the first to publish!</p>
            </div>
          )}
        </section>

        {/* ===== CTA ===== */}
        <section className="mt-20">
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${style.gradient} p-8 md:p-12`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  Start creating your {style.name} artwork
                </h3>
                <p className="text-white/80">
                  {style.name} Style Enhance is preset for you, just describe your idea
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
                >
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}