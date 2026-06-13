"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Coins, 
  Crown, 
  History, 
  Download, 
  Trash2,
  Image as ImageIcon,
  Loader2,
  Settings
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ImageDetailModal from "@/components/ImageDetailModal";

interface UserImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  model: string;
}

function ImageWithFallback({ src, alt, fill, className, unoptimized }: {
  src: string; alt: string; fill?: boolean; className?: string; unoptimized?: boolean;
}) {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className={`${className || ""} flex items-center justify-center bg-gray-100 text-gray-400`}>
        <ImageIcon className="w-8 h-8" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={unoptimized}
      onError={() => setError(true)}
    />
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  async function fetchData() {
    try {
      const creditsRes = await fetch("/api/credits");
      if (creditsRes.ok) {
        const data = await creditsRes.json();
        setCredits(data.credits);
        setSubscriptionTier(data.subscriptionTier);
      }

      const imagesRes = await fetch("/api/images?limit=20");
      if (imagesRes.ok) {
        const data = await imagesRes.json();
        setImages(data.images);
        setNextCursor(data.nextCursor);
      } else {
        console.error("Failed to fetch images:", imagesRes.status);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/images?limit=20&cursor=${nextCursor}`);
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [...prev, ...data.images]);
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      console.error("Error loading more images:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  async function deleteImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setImages(images.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }

  async function downloadImage(imageUrl: string, prompt: string) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-${prompt.slice(0, 30).replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }

  async function manageSubscription() {
    try {
      const res = await fetch("/api/creem/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.portalUrl) {
          window.location.href = data.portalUrl;
        } else {
          setToast({ message: data.error || "No active subscription found", type: "error" });
        }
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Failed to open subscription portal", type: "error" });
      }
    } catch (error) {
      console.error("Error opening subscription portal:", error);
      setToast({ message: "Failed to open subscription portal", type: "error" });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
            toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Images</p>
                <p className="text-2xl font-bold text-gray-900">{images.length}{nextCursor ? "+" : ""}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining Credits</p>
                <p className="text-2xl font-bold text-gray-900">{credits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {subscriptionTier || "Free"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-1">
                {subscriptionTier && subscriptionTier !== "free" ? (
                  <button
                    onClick={manageSubscription}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Manage Subscription
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Upgrade Plan
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Account Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Images</h2>
            </div>
          </div>
          
          {images.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
              <p className="text-gray-600 mb-4">Start creating amazing AI-generated images!</p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate Your First Image
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                {images.map((image) => (
                  <div key={image.id} className="group relative bg-gray-100 rounded-xl overflow-hidden aspect-square cursor-pointer" onClick={() => setSelectedImageId(image.id)}>
                    <ImageWithFallback
                      src={image.imageUrl}
                      alt={image.prompt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadImage(image.imageUrl, image.prompt); }}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-gray-900" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteImage(image.id); }}
                        className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                      <p className="text-gray-300 text-xs mt-1">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {nextCursor && (
                <div className="px-6 py-4 border-t border-gray-200 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ImageDetailModal
        imageId={selectedImageId}
        onClose={() => setSelectedImageId(null)}
        currentUserId={session?.user?.id}
        onUpdate={fetchData}
      />
    </div>
  );
}
