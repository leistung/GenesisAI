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
  Camera,
  Mountain,
  ShoppingBag,
  Star,
  Users,
  TrendingUp,
  Award,
  Gem,
  Crown,
  Aperture,
  Frame,
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

// Style-specific hero icons
const styleIcons: Record<string, React.ReactNode> = {
  anime: <Palette className="w-7 h-7 text-white" />,
  portrait: <Camera className="w-7 h-7 text-white" />,
  landscape: <Mountain className="w-7 h-7 text-white" />,
  creative: <Sparkles className="w-7 h-7 text-white" />,
  product: <ShoppingBag className="w-7 h-7 text-white" />,
};

// Style-specific stats/features shown in hero
const styleFeatures: Record<string, { icon: React.ReactNode; label: string; value: string }[]> = {
  anime: [
    { icon: <Zap className="w-4 h-4" />, label: "Styles", value: "50+" },
    { icon: <Users className="w-4 h-4" />, label: "Artists", value: "10K+" },
    { icon: <Star className="w-4 h-4" />, label: "Quality", value: "4K" },
  ],
  portrait: [
    { icon: <Aperture className="w-4 h-4" />, label: "Lighting", value: "Pro" },
    { icon: <Award className="w-4 h-4" />, label: "Retouching", value: "Auto" },
    { icon: <Camera className="w-4 h-4" />, label: "Output", value: "HD" },
  ],
  landscape: [
    { icon: <Mountain className="w-4 h-4" />, label: "Scenes", value: "100+" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "HDR", value: "8K" },
    { icon: <Frame className="w-4 h-4" />, label: "Formats", value: "Wide" },
  ],
  creative: [
    { icon: <Gem className="w-4 h-4" />, label: "Mediums", value: "30+" },
    { icon: <Crown className="w-4 h-4" />, label: "Quality", value: "Master" },
    { icon: <Sparkles className="w-4 h-4" />, label: "Styles", value: "Unlimited" },
  ],
  product: [
    { icon: <ShoppingBag className="w-4 h-4" />, label: "Templates", value: "40+" },
    { icon: <Zap className="w-4 h-4" />, label: "Speed", value: "Fast" },
    { icon: <Award className="w-4 h-4" />, label: "Quality", value: "E-com" },
  ],
};

// Style-specific prompt placeholders
const stylePlaceholders: Record<string, string> = {
  anime: "Describe your anime character or scene... e.g. a magical girl with silver hair under cherry blossoms",
  portrait: "Describe the portrait you want... e.g. professional headshot with soft studio lighting",
  landscape: "Describe the landscape... e.g. majestic mountain range at golden hour with misty valleys",
  creative: "Describe your artistic vision... e.g. surrealist painting with floating islands and bioluminescent creatures",
  product: "Describe the product shot... e.g. premium skincare bottle on white background with soft shadows",
};

export default function StyleGeneratorPage({ style }: StyleGeneratorPageProps) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; creditsCost: number } | null>(null);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; displayName: string; creditsCost: number }>>([]);
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

  const sid = style.id;

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
    fetchModels();
  }, [session]);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          setSelectedModel(data.models[0]);
        }
      }
    } catch {
      const fallback = [{ id: "qwen-image-edit", name: "qwen-image-edit", displayName: "Qwen Image Edit", creditsCost: 1 }];
      setAvailableModels(fallback);
      setSelectedModel(fallback[0]);
    }
  }

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
          model: selectedModel?.name || selectedModel?.id || "qwen-image-edit",
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

  // ===================== STYLE-SPECIFIC HERO SECTIONS =====================

  const renderHero = () => {
    switch (sid) {
      case "anime":
        return (
          <section className="relative overflow-hidden">
            {/* Anime: Large banner with manga-panel-style grid */}
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-[0.05]`} />
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-400/15 to-purple-400/15 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-400/10 to-fuchsia-400/10 rounded-full blur-3xl" />
            </div>
            {/* Diagonal lines decoration */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="h-full w-full" style={{
                backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
                backgroundSize: "40px 40px",
              }} />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 font-medium">{style.name}</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-xl shadow-pink-500/25`}>
                      {styleIcons[sid]}
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                        {style.name}
                        <span className={`ml-3 text-base font-semibold px-4 py-1.5 rounded-full bg-gradient-to-r ${style.gradient} text-white align-middle`}>
                          AI Powered
                        </span>
                      </h1>
                      <p className="text-lg text-gray-500 mt-1">{style.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg max-w-2xl">{style.description}</p>
                  <div className="flex items-center gap-6 mt-6">
                    {styleFeatures[sid]?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-500">
                        <span className={`text-pink-500`}>{f.icon}</span>
                        <div>
                          <div className="text-xs text-gray-400">{f.label}</div>
                          <div className="text-sm font-bold text-gray-800">{f.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {session?.user && credits !== null && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Available Credits</div>
                      <div className="text-lg font-bold text-gray-900">{credits}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case "portrait":
        return (
          <section className="relative overflow-hidden">
            {/* Portrait: Split layout with camera aperture feel */}
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-[0.04]`} />
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-blue-200/20 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-indigo-200/15 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-200/10 rounded-full" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 font-medium">{style.name}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${style.gradient} text-white text-sm font-medium mb-5 shadow-lg shadow-blue-500/20`}>
                    <Camera className="w-4 h-4" />
                    Professional Studio
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                    {style.name}
                  </h1>
                  <p className="text-xl text-gray-500 mb-3">{style.subtitle}</p>
                  <p className="text-gray-600 leading-relaxed">{style.description}</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  {session?.user && credits !== null && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Available Credits</div>
                        <div className="text-lg font-bold text-gray-900">{credits}</div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {styleFeatures[sid]?.map((f, i) => (
                      <div key={i} className="text-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-blue-500 flex justify-center mb-1">{f.icon}</span>
                        <div className="text-xs text-gray-400">{f.label}</div>
                        <div className="text-sm font-bold text-gray-800">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "landscape":
        return (
          <section className="relative overflow-hidden">
            {/* Landscape: Full-width immersive with horizon line */}
            <div className={`absolute inset-0 bg-gradient-to-b ${style.gradient} opacity-[0.06]`} />
            <div className="absolute inset-0">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-50/50 to-transparent" />
              <div className="absolute top-10 right-20 w-80 h-80 bg-gradient-to-bl from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 font-medium">{style.name}</span>
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20`}>
                  {styleIcons[sid]}
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                  {style.name}
                </h1>
                <p className="text-xl text-gray-500 mb-3">{style.subtitle}</p>
                <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">{style.description}</p>
                <div className="flex items-center justify-center gap-8 mt-8">
                  {styleFeatures[sid]?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-500">
                      <span className="text-emerald-500">{f.icon}</span>
                      <div className="text-left">
                        <div className="text-xs text-gray-400">{f.label}</div>
                        <div className="text-sm font-bold text-gray-800">{f.value}</div>
                      </div>
                    </div>
                  ))}
                  {session?.user && credits !== null && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Credits</div>
                        <div className="text-sm font-bold text-gray-900">{credits}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      case "creative":
        return (
          <section className="relative overflow-hidden">
            {/* Creative: Asymmetric with floating elements */}
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-[0.04]`} />
            <div className="absolute inset-0">
              <div className="absolute top-10 left-20 w-32 h-32 border-2 border-purple-200/20 rounded-2xl rotate-12" />
              <div className="absolute top-40 right-32 w-24 h-24 border-2 border-violet-200/15 rounded-full" />
              <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-3xl blur-2xl rotate-6" />
              <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-bl from-fuchsia-400/8 to-violet-400/8 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 font-medium">{style.name}</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-xl shadow-purple-500/25 rotate-3`}>
                      {styleIcons[sid]}
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight italic">
                        {style.name}
                      </h1>
                      <p className="text-lg text-gray-500">{style.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg">{style.description}</p>
                  <div className="flex items-center gap-5 mt-6">
                    {styleFeatures[sid]?.map((f, i) => (
                      <div key={i} className={`px-4 py-2 rounded-2xl border border-purple-100 bg-purple-50/50`}>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">{f.icon}</span>
                          <div>
                            <div className="text-xs text-purple-400">{f.label}</div>
                            <div className="text-sm font-bold text-gray-800">{f.value}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {session?.user && credits !== null && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg -rotate-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Available Credits</div>
                      <div className="text-lg font-bold text-gray-900">{credits}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case "product":
        return (
          <section className="relative overflow-hidden">
            {/* Product: Clean minimal with geometric shapes */}
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-[0.03]`} />
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-400/8 to-red-400/8 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-400/5 to-orange-400/5 rounded-full blur-3xl" />
            </div>
            {/* Clean grid pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="h-full w-full" style={{
                backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }} />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 font-medium">{style.name}</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg shadow-orange-500/20`}>
                      {styleIcons[sid]}
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                        {style.name}
                      </h1>
                      <p className="text-gray-500">{style.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed max-w-xl">{style.description}</p>
                  <div className="flex items-center gap-6 mt-5">
                    {styleFeatures[sid]?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-orange-500">{f.icon}</span>
                        <span className="text-sm text-gray-600"><strong className="text-gray-900">{f.value}</strong> {f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {session?.user && credits !== null && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Available Credits</div>
                      <div className="text-lg font-bold text-gray-900">{credits}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // ===================== STYLE-SPECIFIC USE CASES SECTIONS =====================

  const renderUseCases = () => {
    switch (sid) {
      case "anime":
        // Anime: Large cards with manga-panel style
        return (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manga Inspiration</h2>
                <p className="text-gray-500 mt-1">Click a scene to fill in the prompt</p>
              </div>
              <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 transition-colors">
                Unlock more styles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {style.useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(useCase.prompt)}
                  className="group relative text-left bg-white rounded-3xl border-2 border-gray-100 overflow-hidden hover:border-pink-200 hover:shadow-2xl hover:shadow-pink-100/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-1">{useCase.title}</h3>
                      <p className="text-white/70 text-xs line-clamp-2">{useCase.prompt}</p>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg`}>
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case "portrait":
        // Portrait: Vertical cards like photo prints
        return (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Photo Styles</h2>
                <p className="text-gray-500 mt-1">Choose a portrait style to get started</p>
              </div>
              <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                More styles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {style.useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(useCase.prompt)}
                  className="group relative text-left bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-semibold text-sm">{useCase.title}</span>
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 truncate">{useCase.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{useCase.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case "landscape":
        // Landscape: Wide panoramic cards
        return (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Scenic Inspiration</h2>
                <p className="text-gray-500 mt-1">Click a landscape to fill in the prompt</p>
              </div>
              <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                Explore more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {style.useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(useCase.prompt)}
                  className="group relative text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300"
                >
                  <div className="aspect-[21/9] overflow-hidden relative">
                    <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <span className="px-3 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg">{useCase.title}</span>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-2">{useCase.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case "creative":
        // Creative: Masonry-like staggered grid
        return (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Artistic Sparks</h2>
                <p className="text-gray-500 mt-1">Let these ideas ignite your creativity</p>
              </div>
              <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors">
                More inspiration <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {style.useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(useCase.prompt)}
                  className={`group relative text-left bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-purple-200 transition-all duration-300 hover:-translate-y-1 ${
                    idx === 0 ? "row-span-2" : ""
                  }`}
                >
                  <div className={`overflow-hidden relative ${idx === 0 ? "aspect-[3/4]" : "aspect-square"}`}>
                    <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <h3 className="text-white font-bold text-sm">{useCase.title}</h3>
                      <p className="text-white/70 text-xs line-clamp-2 mt-1">{useCase.prompt}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-700">{useCase.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case "product":
        // Product: Clean catalog-style cards
        return (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Templates</h2>
                <p className="text-gray-500 mt-1">Professional e-commerce photo styles</p>
              </div>
              <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors">
                All templates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {style.useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(useCase.prompt)}
                  className="group relative text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden relative bg-gray-50">
                    <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-md`}>
                        <Play className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800">{useCase.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-1">{useCase.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // ===================== STYLE-SPECIFIC PANEL HEADER =====================

  const panelTitle: Record<string, string> = {
    anime: "Anime Studio",
    portrait: "Portrait Studio",
    landscape: "Landscape Studio",
    creative: "Creative Studio",
    product: "Product Studio",
  };

  const panelSubtitle: Record<string, string> = {
    anime: "Bring your anime vision to life",
    portrait: "Create professional portrait photos",
    landscape: "Generate breathtaking landscapes",
    creative: "Unleash your artistic imagination",
    product: "Produce stunning product photos",
  };

  // ===================== RENDER =====================

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO SECTION ===== */}
      {renderHero()}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== GENERATOR PANEL ===== */}
          <div className="lg:col-span-2">
            <div className="relative bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
              {/* Panel header */}
              <div className={`px-6 py-4 border-b border-gray-100 ${
                sid === "anime" ? "bg-gradient-to-r from-pink-50 to-purple-50" :
                sid === "portrait" ? "bg-gradient-to-r from-blue-50 to-indigo-50" :
                sid === "landscape" ? "bg-gradient-to-r from-emerald-50 to-teal-50" :
                sid === "creative" ? "bg-gradient-to-r from-purple-50 to-violet-50" :
                "bg-gradient-to-r from-orange-50 to-red-50"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                      <Wand2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{panelTitle[sid] || `AI ${style.name} Generator`}</h2>
                      <p className="text-xs text-gray-500">{panelSubtitle[sid] || "Describe your idea, AI brings it to life"}</p>
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
                  <div className={`mb-5 p-3 rounded-2xl border ${
                    sid === "anime" ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100" :
                    sid === "portrait" ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" :
                    sid === "landscape" ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100" :
                    sid === "creative" ? "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100" :
                    "bg-gradient-to-r from-orange-50 to-red-50 border-orange-100"
                  }`}>
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
                    className={`mb-5 w-full h-20 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 transition-all ${
                      sid === "anime" ? "border-pink-200 text-pink-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50/50" :
                      sid === "portrait" ? "border-blue-200 text-blue-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50" :
                      sid === "landscape" ? "border-emerald-200 text-emerald-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/50" :
                      sid === "creative" ? "border-purple-200 text-purple-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50/50" :
                      "border-orange-200 text-orange-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/50"
                    }`}
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
                      placeholder={stylePlaceholders[sid] || `Describe the ${style.name} image...`}
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
                          value={selectedModel?.id || ""}
                          onChange={(e) => {
                            const model = availableModels.find((m) => m.id === e.target.value);
                            if (model) setSelectedModel(model);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                          {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>{model.displayName} ({model.creditsCost} credit{model.creditsCost > 1 ? "s" : ""})</option>
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
                                  ? `border-purple-500 bg-purple-50 text-purple-700`
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
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all border ${
                        selectedModel?.id === model.id
                          ? `border-purple-500 bg-purple-50 text-purple-700`
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      {model.displayName}
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
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r ${style.gradient} text-white rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50`}
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
                      <div className={`mt-4 p-4 rounded-2xl border text-center ${
                        sid === "anime" ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100" :
                        sid === "portrait" ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" :
                        sid === "landscape" ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100" :
                        sid === "creative" ? "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100" :
                        "bg-gradient-to-r from-orange-50 to-red-50 border-orange-100"
                      }`}>
                        <p className="text-sm text-gray-600 mb-2">Sign in to publish your work to the community</p>
                        <Link
                          href="/signin"
                          className={`px-4 py-2 text-sm bg-gradient-to-r ${style.gradient} text-white rounded-xl hover:opacity-90 transition-all shadow-md inline-block`}
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
              <div className={`px-5 py-4 border-b border-gray-100 ${
                sid === "anime" ? "bg-gradient-to-r from-pink-50 to-white" :
                sid === "portrait" ? "bg-gradient-to-r from-blue-50 to-white" :
                sid === "landscape" ? "bg-gradient-to-r from-emerald-50 to-white" :
                sid === "creative" ? "bg-gradient-to-r from-purple-50 to-white" :
                "bg-gradient-to-r from-orange-50 to-white"
              }`}>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${
                    sid === "anime" ? "text-pink-500" :
                    sid === "portrait" ? "text-blue-500" :
                    sid === "landscape" ? "text-emerald-500" :
                    sid === "creative" ? "text-purple-500" :
                    "text-orange-500"
                  }`} />
                  About {style.name}
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 leading-relaxed">{style.description}</p>
                <div className={`mt-4 p-3 rounded-2xl border ${
                  sid === "anime" ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100" :
                  sid === "portrait" ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" :
                  sid === "landscape" ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100" :
                  sid === "creative" ? "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100" :
                  "bg-gradient-to-r from-orange-50 to-red-50 border-orange-100"
                }`}>
                  <div className="flex items-start gap-2">
                    <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      sid === "anime" ? "text-pink-500" :
                      sid === "portrait" ? "text-blue-500" :
                      sid === "landscape" ? "text-emerald-500" :
                      sid === "creative" ? "text-purple-500" :
                      "text-orange-500"
                    }`} />
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
                  <Layers className={`w-4 h-4 ${
                    sid === "anime" ? "text-pink-500" :
                    sid === "portrait" ? "text-blue-500" :
                    sid === "landscape" ? "text-emerald-500" :
                    sid === "creative" ? "text-purple-500" :
                    "text-orange-500"
                  }`} />
                  Supported Models
                </h3>
              </div>
              <div className="p-5 space-y-2">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                      selectedModel?.id === model.id
                        ? `bg-purple-50 border border-purple-200`
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <span className="text-gray-700">{model.displayName}</span>
                    {selectedModel?.id === model.id && (
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${style.gradient}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== USE CASES ===== */}
        {renderUseCases()}

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
