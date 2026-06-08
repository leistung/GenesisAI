"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Mail, Lock, User, Eye, EyeOff, X, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

function Toast({ message, type, onClose }: { message: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`flex items-center gap-3 border shadow-xl rounded-2xl px-5 py-4 min-w-[320px] max-w-[420px] ${
        isError
          ? "bg-white border-red-200"
          : "bg-white border-green-200"
      }`}>
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        )}
        <p className={`text-sm flex-1 ${isError ? "text-red-700" : "text-green-700"}`}>{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SignInContent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Check for NextAuth error in URL
  const urlError = searchParams.get("error");

  useEffect(() => {
    if (urlError === "CredentialsSignin") {
      setToastType("error");
      setToast("Invalid email or password");
    } else if (urlError === "Configuration") {
      setToastType("error");
      setToast("Server configuration error. Please try again later.");
    } else if (urlError) {
      setToastType("error");
      setToast("Authentication failed. Please try again.");
    }
  }, [urlError]);

  const closeToast = useCallback(() => setToast(""), []);

  const showToast = useCallback((message: string, type: "error" | "success" = "error") => {
    setToastType(type);
    setToast(message);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast("");
    setLoading(true);

    try {
      if (mode === "register") {
        // Validate inputs
        if (!name.trim()) {
          showToast("Please enter your name");
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          showToast("Please enter your email");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          showToast("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        // Register
        let data;
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
          });

          data = await res.json();

          if (!res.ok) {
            showToast(data.error || "Registration failed");
            setLoading(false);
            return;
          }
        } catch (fetchError) {
          console.error("Registration fetch error:", fetchError);
          showToast("Network error. Please check your connection and try again.");
          setLoading(false);
          return;
        }

        // Auto sign in after registration
        try {
          const result = await signIn("credentials", {
            email: email.trim(),
            password,
            redirect: false,
          });

          if (result?.error) {
            showToast("Account created! Please sign in with your credentials.", "success");
            setMode("login");
            setLoading(false);
            return;
          }

          // Registration and login successful
          showToast("Account created successfully!", "success");
          setTimeout(() => {
            router.push(callbackUrl);
            router.refresh();
          }, 500);
        } catch (signInError) {
          console.error("Auto sign-in error after registration:", signInError);
          showToast("Account created! Please sign in with your credentials.", "success");
          setMode("login");
          setLoading(false);
        }
      } else {
        // Sign in
        if (!email.trim()) {
          showToast("Please enter your email");
          setLoading(false);
          return;
        }
        if (!password) {
          showToast("Please enter your password");
          setLoading(false);
          return;
        }

        try {
          const result = await signIn("credentials", {
            email: email.trim(),
            password,
            redirect: false,
          });

          if (result?.error) {
            const errorMsg = result.error === "CredentialsSignin"
              ? "Invalid email or password"
              : "Authentication failed. Please try again.";
            showToast(errorMsg);
            setLoading(false);
            return;
          }

          // Login successful (result may be undefined on success in NextAuth v5)
          router.push(callbackUrl);
          router.refresh();
          setLoading(false);
        } catch (signInError) {
          console.error("Sign-in error:", signInError);
          showToast("Something went wrong. Please try again.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      showToast("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <>
      {toast && <Toast message={toast} type={toastType} onClose={closeToast} />}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isRegister ? "Create your account" : "Sign in to your account"}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isRegister
                ? "Start creating amazing AI-generated images"
                : "Welcome back! Continue your creative journey"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setToast(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                !isRegister
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setToast(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isRegister
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "At least 6 characters" : "Your password"}
                  minLength={isRegister ? 6 : undefined}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 text-gray-500">
                or
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 hover:shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </>
  );
}
