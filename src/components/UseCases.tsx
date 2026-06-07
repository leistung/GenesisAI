"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const useCases = [
  { id: "1", title: "Create a holiday card", image: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=300&h=200&fit=crop" },
  { id: "2", title: "What would I look like as a K-Pop star?", image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=200&fit=crop" },
  { id: "3", title: "Me as The Girl with a Pearl", image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=300&h=200&fit=crop" },
  { id: "4", title: "Create an album cover", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=200&fit=crop" },
  { id: "5", title: "Style me", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=200&fit=crop" },
  { id: "6", title: "Create a professional product photo", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop" },
  { id: "7", title: "Redecorate my room", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&h=200&fit=crop" },
  { id: "8", title: "Give us a matching outfit", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=200&fit=crop" },
  { id: "9", title: "Create a professional job photo", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop" },
  { id: "10", title: "Remove people in the background", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop" },
  { id: "11", title: "Restore an old photo", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop" },
  { id: "12", title: "Turn into a keychain", image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=300&h=200&fit=crop" },
];

export default function UseCases() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Discover something new
        </h2>
        <p className="text-lg text-gray-600">
          Explore creative ways to use AI image generation
        </p>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
        )}

        {/* Use Cases Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {useCases.map((useCase) => (
            <button
              key={useCase.id}
              className="flex-shrink-0 w-72 group text-left"
            >
              <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
                <img
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                {useCase.title}
              </p>
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
