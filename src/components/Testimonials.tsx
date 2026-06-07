"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sophie Miller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    comment: "GenesisAI has completely transformed my creative workflow. The quality is incredible and it's completely free!",
    role: "Digital Artist",
  },
  {
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    comment: "As a marketer, I need quick visuals for campaigns. GenesisAI delivers professional results in seconds.",
    role: "Marketing Manager",
  },
  {
    name: "Sarah Wang",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    comment: "The best AI image generator I've ever used. No limits, no fees, just pure creativity.",
    role: "Content Creator",
  },
];

export default function Testimonials() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          What Users Say About GenesisAI
        </h2>
        <p className="text-lg text-gray-600">
          See how creators use GenesisAI and AI Image Editor to boost their productivity
        </p>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-gray-600">Rated 4.9/5 by 25,017+ users.</span>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            {/* Rating */}
            <div className="flex mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>

            {/* Comment */}
            <p className="text-gray-700 mb-6">
              &ldquo;{testimonial.comment}&rdquo;
            </p>

            {/* User Info */}
            <div className="flex items-center">
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-semibold text-gray-900">
                  {testimonial.name}
                </h4>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
