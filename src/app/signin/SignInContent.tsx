"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Mail, Lock, User, Eye, EyeOff, X, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

// Dev-only logger
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[Auth]", ...args);
  }
};

const devError = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.error("[Auth]", ...args);
  }
};

function Toast({ message, type, onClose }: { message: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}>
      <div className={`flex items-center gap-3 border shadow-xl rounded-2xl px-5 py-4 min-w-[320px] max-w-[420px] ${
        isError ? "bg-white border-red-200" : "bg-white border-green-200"
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

export default function SignInContent({ mode = "login" }: { mode?: "login" | "register" }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Check for NextAuth error in URL
  const urlError = searchParams.get("error");

  useEffect(() => {
    if (urlError === "CredentialsSignin") {
      setToastType("error");
      setToast("Invalid email or password");
    } else if (urlError === "Configuration") {
      setToastType("error");
      setToast("Server configuration error, please try again later");
    } else if (urlError) {
      setToastType("error");
      setToast("Authentication failed, please try again");
    }
  }, [urlError]);

  const closeToast = useCallback(() => setToast(""), []);

  const showToast = useCallback((message: string, type: "error" | "success" = "error") => {
    setToastType(type);
    setToast(message);
  }, []);

  // Switch to register page
  function goToRegister() {
    router.push("/signup?callbackUrl=" + encodeURIComponent(callbackUrl));
  }

  // Switch to login page
  function goToLogin() {
    router.push("/signin?callbackUrl=" + encodeURIComponent(callbackUrl));
  }

  // Simple email validation
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Handle login form submit
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    devLog("Login form submitted", { email: email.trim() });
    setToast("");
    setLoading(true);

    try {
      if (!email.trim()) {
        showToast("Please enter your email");
        setLoading(false);
        return;
      }
      if (!isValidEmail(email.trim())) {
        showToast("Please enter a valid email address");
        setLoading(false);
        return;
      }
      if (!password) {
        showToast("Please enter your password");
        setLoading(false);
        return;
      }

      devLog("Calling signIn with credentials...");
      let result: { error?: string; status?: number; ok?: boolean };
      try {
        result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        }) as { error?: string; status?: number; ok?: boolean };
      } catch (signInErr) {
        devError("signIn exception:", signInErr);
        showToast("Login request failed, please try again");
        setLoading(false);
        return;
      }

      devLog("signIn result:", result);

      if (result?.error) {
        devError("signIn error:", result.error);
        const errorMsg = result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : "Login failed, please try again";
        showToast(errorMsg);
        setLoading(false);
        return;
      }

      // Login successful
      devLog("Login successful, redirecting to:", callbackUrl);
      showToast("Login successful!", "success");
      setLoading(false);
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 500);
    } catch (error) {
      devError("Login exception:", error);
      showToast("An error occurred, please try again");
      setLoading(false);
    }
  }

  // Handle register form submit
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    devLog("Register form submitted", { name: name.trim(), email: email.trim() });
    setToast("");
    setLoading(true);

    try {
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
      if (!isValidEmail(email.trim())) {
        showToast("Please enter a valid email address");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        showToast("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      // Call register API
      devLog("Sending register request to /api/auth/register...", { name: name.trim(), email: email.trim() });
      let res: Response;
      try {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });
      } catch (fetchErr) {
        devError("Register fetch network error:", fetchErr);
        showToast("Network error, please check your connection and try again");
        setLoading(false);
        return;
      }

      let data: { message?: string; error?: string; user?: { id: string; email: string; name: string } };
      try {
        data = await res.json();
      } catch (parseErr) {
        devError("Register response parse error:", parseErr);
        showToast("Unexpected server response, please try again");
        setLoading(false);
        return;
      }

      devLog("Register API response:", { status: res.status, ok: res.ok, data });

      if (!res.ok) {
        const errorMsg = data.error || "Registration failed, please try again";
        devError("Register failed:", errorMsg);
        showToast(errorMsg);
        setLoading(false);
        return;
      }

      devLog("Registration successful! Redirecting to login...");
      showToast("Registration successful! Please sign in", "success");
      setLoading(false);
      setTimeout(() => goToLogin(), 1500);
    } catch (err) {
      devError("Register exception:", err);
      showToast("An error occurred, please try again");
      setLoading(false);
    }
  }

  return (
    <>
      {toast && <Toast message={toast} type={toastType} onClose={closeToast} />}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-8 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to home</span>
            </Link>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isRegister
                ? "Sign up to start your AI image creation journey"
                : "Sign in to your account to continue creating"}
            </p>
          </div>

          {/* Card */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            {isRegister ? (
              /* ====== Register Form ====== */
              <form onSubmit={handleRegister} noValidate className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      autoComplete="name"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ====== Login Form ====== */
              <form onSubmit={handleLogin} noValidate className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={goToRegister}
                  className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Sign up free
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
