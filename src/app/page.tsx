"use client";

import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import StyleTemplates from "@/components/StyleTemplates";
import UseCases from "@/components/UseCases";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section id="hero" className="pt-4">
        <Hero />
      </section>

      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <StyleTemplates />
      </section>

      <section id="gallery" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <Gallery />
      </section>

      <section id="use-cases" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <UseCases />
      </section>

      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <Features />
      </section>

      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Testimonials />
      </section>

      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <FAQ />
      </section>
    </main>
  );
}
