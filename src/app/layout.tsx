import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "GenesisAI - Create Stunning Images with AI",
  description: "Create stunning AI-generated images in seconds. Free tier available with daily credits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <SessionProvider>
          <Header />
          <div className="pt-16">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
