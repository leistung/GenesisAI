"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is GenesisAI and how does it work?",
    answer: "GenesisAI Image Generator is a completely free AI image generator powered by an intelligent multi-model routing system. It lets you create high-quality images from text descriptions with no registration required.",
  },
  {
    question: "Is GenesisAI really free to use?",
    answer: "Yes, GenesisAI Image Generator is completely free to use! We are committed to being the world's largest and most powerful free AI Image Generator. There are no hidden fees, no credit card required.",
  },
  {
    question: "What makes GenesisAI different from other AI image generators?",
    answer: "GenesisAI Image Generator offers free access to an intelligent multi-model router with no generation count limits. We provide superior image quality, fast generation speed and complete privacy protection.",
  },
  {
    question: "Do I need to create an account to use GenesisAI?",
    answer: "No account needed — the GenesisAI Image Generator lets you visit and start generating images immediately. We believe in making AI accessible to everyone without barriers.",
  },
  {
    question: "What types of images can I create with GenesisAI?",
    answer: "The GenesisAI Image Generator lets you create a wide variety of images including photorealistic scenes, artistic illustrations, digital art, anime-style images and more.",
  },
  {
    question: "How does GenesisAI protect my privacy?",
    answer: "We follow a minimal data collection approach: requests from users who are not signed in are typically processed temporarily, while signed-in users retain only the information needed for account features.",
  },
  {
    question: "What powers GenesisAI's in-house models?",
    answer: "GenesisAI's in-house image model is powered by Seedream 5.0, and GenesisAI's in-house video model is powered by Seedance 2.0. GenesisAI also supports other advanced image models in the industry.",
  },
  {
    question: "Are there any limitations to using GenesisAI?",
    answer: "While GenesisAI is free and has no generation count limits, we maintain standard content guidelines to ensure appropriate use. The platform is designed for web use currently, with mobile apps planned.",
  },
  {
    question: "Can I use the generated images commercially?",
    answer: "Yes, you own the rights to the images you generate with GenesisAI. You can use them for both personal and commercial purposes, making it perfect for creators and businesses alike.",
  },
  {
    question: "Is GenesisAI available on mobile devices?",
    answer: "Currently, GenesisAI is available through our website, which works great on mobile browsers. We're actively developing dedicated mobile apps to provide an even better experience soon.",
  },
  {
    question: "How can I provide feedback or report issues?",
    answer: "We welcome your feedback! You can reach our support team at support@raphael.app. Your input helps us improve and maintain the best free AI image generation service.",
  },
  {
    question: "What's next for GenesisAI?",
    answer: "We're constantly improving our service with regular updates to the AI model and user interface. Future plans include mobile apps and additional creative features, while maintaining our commitment to being free.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-gray-600">
          Have another question? Contact us at{" "}
          <a href="mailto:support@raphael.app" className="text-purple-600 hover:underline">
            support@raphael.app
          </a>
        </p>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 pr-4">
                {faq.question}
              </h3>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
