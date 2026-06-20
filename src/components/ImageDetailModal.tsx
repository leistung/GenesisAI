"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  Loader2,
  Globe,
  Lock,
  MessageCircle,
  Reply,
  Trash2,
  Send,
  LogIn,
  ImageIcon,
} from "lucide-react";

// --- Types ---

interface ImageDetailModalProps {
  imageId: string | null;
  onClose: () => void;
  currentUserId?: string;
  onUpdate?: () => void;
}

interface ImageData {
  id: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  aspectRatio: string;
  style?: string;
  color?: string;
  lighting?: string;
  composition?: string;
  referenceImage?: string;
  isPublic: boolean;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  } | null;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  replies?: CommentData[];
}

// --- Helpers ---

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
  return `${diffYear} year${diffYear > 1 ? "s" : ""} ago`;
}

function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}

// --- Component ---

export default function ImageDetailModal({
  imageId,
  onClose,
  currentUserId,
  onUpdate,
}: ImageDetailModalProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  const isLoggedIn = !!currentUserId;
  const isOwner = !!currentUserId && !!imageData && currentUserId === imageData.user?.id;

  // Animate in/out
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setVisible(!!imageId);
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [imageId]);

  // Fetch image details
  const fetchImage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/images/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load image");
      }
      const data = await res.json();
      setImageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async (id: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/images/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imageId) {
      // Use queueMicrotask to avoid synchronous setState in effect body
      queueMicrotask(() => {
        fetchImage(imageId);
        fetchComments(imageId);
      });
    } else {
      // Reset state via requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setImageData(null);
        setComments([]);
        setError(null);
        setReplyingTo(null);
        setReplyContent("");
        setNewComment("");
      });
    }
  }, [imageId, fetchImage, fetchComments]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (imageId) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [imageId, onClose]);

  // Toggle publish
  async function togglePublish() {
    if (!imageData || !isOwner) return;
    setTogglingPublic(true);
    try {
      const res = await fetch(`/api/images/${imageData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !imageData.isPublic }),
      });
      if (res.ok) {
        setImageData({ ...imageData, isPublic: !imageData.isPublic });
        onUpdate?.();
      }
    } catch (err) {
      console.error("Error toggling publish:", err);
    } finally {
      setTogglingPublic(false);
    }
  }

  // Copy prompt
  async function copyPrompt() {
    if (!imageData) return;
    try {
      await navigator.clipboard.writeText(imageData.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = imageData.prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Submit comment
  async function submitComment() {
    if (!imageId || !newComment.trim() || !isLoggedIn) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/images/${imageId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments(imageId);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  }

  // Submit reply
  async function submitReply(parentId: string) {
    if (!imageId || !replyContent.trim() || !isLoggedIn) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/images/${imageId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchComments(imageId);
      }
    } catch (err) {
      console.error("Error posting reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  }

  // Delete comment
  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok && imageId) {
        fetchComments(imageId);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setDeletingCommentId(null);
    }
  }

  // Handle overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Don't render if no imageId
  if (!imageId) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 ${
        visible ? "bg-black/60" : "bg-black/0"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading image details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => imageId && fetchImage(imageId)}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : imageData ? (
          <div className="flex flex-col lg:flex-row max-h-[90vh]">
            {/* Left: Image */}
            <div className="lg:w-3/5 bg-gray-100 flex items-center justify-center p-4 lg:p-6 min-h-[300px] lg:min-h-0">
              <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
                {isDataUrl(imageData.imageUrl) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageData.imageUrl}
                    alt={imageData.prompt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                ) : (
                  <Image
                    src={imageData.imageUrl}
                    alt={imageData.prompt}
                    width={800}
                    height={800}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    unoptimized
                  />
                )}
              </div>
            </div>

            {/* Right: Details panel */}
            <div className="lg:w-2/5 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="p-6 space-y-6">
                {/* Author info */}
                <div className="flex items-center gap-3">
                  {imageData.user ? (
                    <Link href={`/community?user=${imageData.user.id}`}>
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {imageData.user.image ? (
                          isDataUrl(imageData.user.image) ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageData.user.image}
                              alt={imageData.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image
                              src={imageData.user.image}
                              alt={imageData.user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                            {imageData.user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-500 text-sm font-medium">
                      ?
                    </div>
                  )}
                  <div>
                    {imageData.user ? (
                      <Link
                        href={`/community?user=${imageData.user.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
                      >
                        {imageData.user.name || "Anonymous"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">Anonymous</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(imageData.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Generation settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Generation Settings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {imageData.style && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full capitalize">
                        {imageData.style}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {imageData.model}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {imageData.aspectRatio}
                    </span>
                    {imageData.color && imageData.color !== "none" && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                        {imageData.color}
                      </span>
                    )}
                    {imageData.lighting && imageData.lighting !== "none" && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full capitalize">
                        {imageData.lighting}
                      </span>
                    )}
                    {imageData.composition && imageData.composition !== "none" && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full capitalize">
                        {imageData.composition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prompt section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Prompt
                  </h4>
                  <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {imageData.prompt}
                    </p>
                    <button
                      onClick={copyPrompt}
                      className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                      title="Copy prompt"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {imageData.negativePrompt && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-500 mb-1">Negative Prompt</p>
                      <p className="text-sm text-red-700 whitespace-pre-wrap break-words">
                        {imageData.negativePrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reference image */}
                {imageData.referenceImage && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Reference Image
                    </h4>
                    <div className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageData.referenceImage}
                        alt="Reference"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}

                {/* Publish/Unpublish toggle (owner only) */}
                {isOwner && (
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      {imageData.isPublic ? (
                        <Globe className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-700">
                        {imageData.isPublic ? "Published" : "Private"}
                      </span>
                    </div>
                    <button
                      onClick={togglePublish}
                      disabled={togglingPublic}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${
                        imageData.isPublic ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      {togglingPublic && (
                        <Loader2 className="w-3 h-3 animate-spin absolute left-1 text-white" />
                      )}
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          imageData.isPublic ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Comments section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Comments {comments.length > 0 && `(${comments.length})`}
                  </h4>

                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUserId={currentUserId}
                          replyingTo={replyingTo}
                          replyContent={replyContent}
                          submittingReply={submittingReply}
                          deletingCommentId={deletingCommentId}
                          onReplyClick={(id) => {
                            setReplyingTo(replyingTo === id ? null : id);
                            setReplyContent("");
                          }}
                          onReplyContentChange={setReplyContent}
                          onSubmitReply={submitReply}
                          onDelete={deleteComment}
                        />
                      ))}
                    </div>
                  )}

                  {/* New comment input */}
                  {isLoggedIn ? (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitComment();
                          }
                        }}
                      />
                      <button
                        onClick={submitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Link
                        href="/signin"
                        className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in to comment
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --- Comment Item (with nested replies) ---

function CommentItem({
  comment,
  currentUserId,
  replyingTo,
  replyContent,
  submittingReply,
  deletingCommentId,
  onReplyClick,
  onReplyContentChange,
  onSubmitReply,
  onDelete,
  depth = 0,
}: {
  comment: CommentData;
  currentUserId?: string;
  replyingTo: string | null;
  replyContent: string;
  submittingReply: boolean;
  deletingCommentId: string | null;
  onReplyClick: (id: string) => void;
  onReplyContentChange: (val: string) => void;
  onSubmitReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  const isAuthor = !!currentUserId && currentUserId === comment.user.id;
  const isReplying = replyingTo === comment.id;
  const isDeleting = deletingCommentId === comment.id;

  return (
    <div className={depth > 0 ? "ml-8 pl-4 border-l-2 border-gray-100" : ""}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <Link href={`/community?user=${comment.user.id}`} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
            {comment.user.image ? (
              isDataUrl(comment.user.image) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={comment.user.image}
                  alt={comment.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={comment.user.image}
                  alt={comment.user.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                {comment.user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/community?user=${comment.user.id}`}
              className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
            >
              {comment.user.name || "Anonymous"}
            </Link>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            {currentUserId && (
              <button
                onClick={() => onReplyClick(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => onDelete(comment.id)}
                disabled={isDeleting}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitReply(comment.id);
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyContent.trim() || submittingReply}
                className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyContent={replyContent}
              submittingReply={submittingReply}
              deletingCommentId={deletingCommentId}
              onReplyClick={onReplyClick}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
