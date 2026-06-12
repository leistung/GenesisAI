"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, Loader2, Globe, Palette, Camera, Mountain, Lightbulb, ShoppingBag } from "lucide-react";

interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  likes: number;
  author: string;
}

const styleFilters = [
  { id: "all", name: "All Styles", icon: Globe },
  { id: "anime", name: "Anime", icon: Palette },
  { id: "portrait", name: "Portrait", icon: Camera },
  { id: "landscape", name: "Landscape", icon: Mountain },
  { id: "creative", name: "Creative", icon: Lightbulb },
  { id: "product", name: "Product", icon: ShoppingBag },
];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeStyle, setActiveStyle] = useState("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const itemsPerPage = 8;

  // Fetch gallery images from API
  useEffect(() => {
    fetchGallery();
  }, [activeStyle]);

  async function fetchGallery() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ public: "true", limit: "20" });
      if (activeStyle !== "all") params.set("style", activeStyle);

      const res = await fetch(`/api/images?${params}`);
      if (res.ok) {
        const data = await res.json();
        const images = data.images || [];
        // Map API response to GalleryItem format
        const mapped: GalleryItem[] = images.map((img: { id: string; imageUrl: string; prompt: string; style?: string; likes: number; author: string }) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          prompt: img.prompt,
          style: img.style || activeStyle,
          likes: img.likes || 0,
          author: img.author,
        }));
        setItems(mapped);
        setNextCursor(data.nextCursor);
        setCurrentPage(0); // Reset to first page when filter changes
      } else {
        setError("Failed to load gallery");
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
      setError("Unable to load gallery images");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const currentItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Get Inspired
        </h2>
        <p className="text-lg text-gray-600">
          Get inspired by what others are creating with GenesisAI
        </p>
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading gallery...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchGallery}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeStyle === "all" ? "No public images yet" : `No ${activeStyle} images yet`}
          </h3>
          <p className="text-gray-600">
            Be the first to share your AI artwork with the community!
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
              >
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80 capitalize">
                        {item.style && item.style !== "all" ? item.style : "Creative"}
                      </span>
                      <div className="flex items-center space-x-1 text-white">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{item.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}