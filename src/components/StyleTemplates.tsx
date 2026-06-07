"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const styles = [
  { id: "sketch", name: "Sketch", image: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=300&h=300&fit=crop" },
  { id: "holiday", name: "Holiday portrait", image: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=300&h=300&fit=crop" },
  { id: "dramatic", name: "Dramatic", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop" },
  { id: "plushie", name: "Plushie", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop" },
  { id: "bobblehead", name: "Baseball bobblehead", image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=300&h=300&fit=crop" },
  { id: "glam_doll", name: "3D glam doll", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&h=300&fit=crop" },
  { id: "doodle", name: "Doodle", image: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?w=300&h=300&fit=crop" },
  { id: "inkwork", name: "Inkwork", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&h=300&fit=crop" },
  { id: "fisheye", name: "Fisheye", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop" },
  { id: "pop_art", name: "Pop art", image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=300&h=300&fit=crop" },
  { id: "ornament", name: "Ornament", image: "https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=300&h=300&fit=crop" },
  { id: "sugar_cookie", name: "Sugar cookie", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop" },
  { id: "art_school", name: "Art school", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop" },
];

export default function StyleTemplates() {
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
      const scrollAmount = 300;
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
          Try a style
        </h2>
        <p className="text-lg text-gray-600">
          Explore different artistic styles for your creations
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

        {/* Styles Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {styles.map((style) => (
            <button
              key={style.id}
              className="flex-shrink-0 group"
            >
              <div className="w-40 h-40 rounded-xl overflow-hidden mb-2">
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <p className="text-sm font-medium text-gray-700 text-center">
                {style.name}
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
