"use client";

import { Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            World&apos;s First Unlimited Free AI Image Generator
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Create stunning{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              AI-generated images
            </span>{" "}
            in seconds
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            No registration required. No generation limits. Just describe what you want, 
            and watch your imagination come to life.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Lightning Fast</strong> Generation
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">
                <strong className="text-gray-900">100% Free</strong> Forever
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Multiple</strong> AI Models
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/generate/anime"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              Start Creating
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
