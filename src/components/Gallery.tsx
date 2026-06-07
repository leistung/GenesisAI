"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface GalleryItem {
  id: string;
  image_url: string;
  prompt: string;
  style: string;
  likes: number;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockItems: GalleryItem[] = [
      {
        id: "1",
        image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
        prompt: "style is lite brite art, luminous and colorful designs",
        style: "pop_art",
        likes: 234
      },
      {
        id: "2",
        image_url: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=400&fit=crop",
        prompt: "high quality sci-fi illustration, astronaut on distant planet",
        style: "dramatic",
        likes: 189
      },
      {
        id: "3",
        image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop",
        prompt: "hyper-detailed action scene on windswept mountain slope",
        style: "art_school",
        likes: 312
      },
      {
        id: "4",
        image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        prompt: "Portrait of a beautiful woman, cinematic lighting",
        style: "glam_doll",
        likes: 456
      },
      {
        id: "5",
        image_url: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&h=400&fit=crop",
        prompt: "dark fantasy, high quality ultra detailed anime",
        style: "dramatic",
        likes: 278
      },
      {
        id: "6",
        image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        prompt: "high quality anime illustration, surreal night scene",
        style: "art_school",
        likes: 198
      },
      {
        id: "7",
        image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
        prompt: "cute cat looking at itself in mirror, photorealistic",
        style: "plushie",
        likes: 567
      },
      {
        id: "8",
        image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop",
        prompt: "quantum computing research laboratory with white surfaces",
        style: "dramatic",
        likes: 145
      },
      {
        id: "9",
        image_url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop",
        prompt: "abstract colorful gradient art, flowing shapes",
        style: "pop_art",
        likes: 321
      },
      {
        id: "10",
        image_url: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=400&fit=crop",
        prompt: "futuristic cyberpunk city at night with neon lights",
        style: "dramatic",
        likes: 412
      },
      {
        id: "11",
        image_url: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop",
        prompt: "cute kawaii character design, pastel colors",
        style: "plushie",
        likes: 289
      },
      {
        id: "12",
        image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
        prompt: "traditional Japanese ink painting, minimalist art",
        style: "art_school",
        likes: 356
      },
      {
        id: "13",
        image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
        prompt: "cute plush toy photography, soft lighting",
        style: "plushie",
        likes: 445
      },
      {
        id: "14",
        image_url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=400&h=400&fit=crop",
        prompt: "pop art style portrait, vibrant colors",
        style: "pop_art",
        likes: 234
      },
      {
        id: "15",
        image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
        prompt: "dramatic mountain landscape, golden hour lighting",
        style: "dramatic",
        likes: 678
      },
      {
        id: "16",
        image_url: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=400&h=400&fit=crop",
        prompt: "hand-drawn sketch style illustration",
        style: "sketch",
        likes: 198
      },
    ];
    setItems(mockItems);
  }, []);

  const totalPages = Math.ceil(items.length / itemsPerPage);
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
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Get Inspired
        </h2>
        <p className="text-lg text-gray-600">
          Get inspired by what others are creating with GenesisAI
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
          >
            <img
              src={item.image_url}
              alt={item.prompt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm line-clamp-2 mb-2">{item.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80 capitalize">{item.style}</span>
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

      {/* Navigation */}
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
    </div>
  );
}
