"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Globe, Palette, Camera, Mountain, Lightbulb, ShoppingBag, Download } from "lucide-react";

const styleFilters = [
  { id: "all", name: "All Styles", icon: Globe },
  { id: "anime", name: "Anime", icon: Palette },
  { id: "portrait", name: "Portrait", icon: Camera },
  { id: "landscape", name: "Landscape", icon: Mountain },
  { id: "creative", name: "Creative", icon: Lightbulb },
  { id: "product", name: "Product", icon: ShoppingBag },
];

interface CommunityImage {
  id: string;
  imageUrl: string;
  prompt: string;
  author: string;
  likes: number;
  style: string;
  createdAt: string;
}

export default function CommunityPage() {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState("all");

  useEffect(() => {
    fetchImages();
  }, [activeStyle]);

  async function fetchImages() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ public: "true", limit: "50" });
      if (activeStyle !== "all") params.set("style", activeStyle);

      const res = await fetch(`/api/images?${params}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error("Error fetching community images:", error);
    } finally {
      setLoading(false);
    }
  }

  async function downloadImage(imageUrl: string, prompt: string) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `community-${prompt.slice(0, 30).replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Gallery</h1>
          <p className="text-gray-600">Explore amazing AI-generated artwork from the community</p>
        </div>

        {/* Style Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {styleFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeStyle === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveStyle(filter.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-full transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.name}
              </button>
            );
          })}
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No public images yet</h3>
            <p className="text-gray-600">Be the first to share your AI artwork with the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.imageUrl}
                    alt={image.prompt}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => downloadImage(image.imageUrl, image.prompt)}
                      className="p-2.5 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-gray-900" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">{image.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">by {image.author}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                      {image.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
