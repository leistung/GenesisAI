"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  Coins,
  Crown,
  Palette,
  Camera,
  Mountain,
  Lightbulb,
  ShoppingBag,
  LayoutDashboard,
  Globe,
  Home,
  CreditCard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const generateLinks = [
  {
    name: "Anime",
    href: "/generate/anime",
    icon: Palette,
    color: "hover:text-pink-500",
    bgColor: "hover:bg-pink-50",
    activeColor: "text-pink-500",
  },
  {
    name: "Portrait",
    href: "/generate/portrait",
    icon: Camera,
    color: "hover:text-blue-500",
    bgColor: "hover:bg-blue-50",
    activeColor: "text-blue-500",
  },
  {
    name: "Landscape",
    href: "/generate/landscape",
    icon: Mountain,
    color: "hover:text-green-500",
    bgColor: "hover:bg-green-50",
    activeColor: "text-green-500",
  },
  {
    name: "Creative",
    href: "/generate/creative",
    icon: Lightbulb,
    color: "hover:text-purple-500",
    bgColor: "hover:bg-purple-50",
    activeColor: "text-purple-500",
  },
  {
    name: "Product",
    href: "/generate/product",
    icon: ShoppingBag,
    color: "hover:text-orange-500",
    bgColor: "hover:bg-orange-50",
    activeColor: "text-orange-500",
  },
];

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Globe },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);

  // Fetch real-time credits from API on mount and navigation
  useEffect(() => {
    if (status !== "authenticated") {
      setCredits(null);
      return;
    }
    fetch("/api/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.credits !== undefined) setCredits(data.credits);
      })
      .catch(() => {});
  }, [status, pathname]);

  const displayCredits = credits ?? session?.user?.credits ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent hidden sm:block">
              GenesisAI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1 ml-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                    isActive
                      ? "text-purple-600 bg-purple-50 font-medium"
                      : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.name}
                </Link>
              );
            })}
            {status === "authenticated" && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                  pathname === "/dashboard"
                    ? "text-purple-600 bg-purple-50 font-medium"
                    : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            <div className="w-px h-6 bg-gray-200 mx-1" />
            {generateLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                    isActive
                      ? `${link.activeColor} bg-gray-50 font-medium`
                      : `text-gray-600 ${link.color}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-3 shrink-0">
            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-full transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span className="font-medium">{displayCredits}</span>
                </Link>
                {session.user?.subscriptionTier && session.user.subscriptionTier !== "free" && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full border border-yellow-200">
                    <Crown className="w-3.5 h-3.5 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700 capitalize">
                      {session.user.subscriptionTier}
                    </span>
                  </div>
                )}
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  <User className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                      isActive
                        ? "text-purple-600 bg-purple-50 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {link.name}
                  </Link>
                );
              })}
              {status === "authenticated" && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                    pathname === "/dashboard"
                      ? "text-purple-600 bg-purple-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
              )}
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                AI Generate
              </div>
              {generateLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                      isActive
                        ? `${link.activeColor} bg-gray-50 font-medium`
                        : `text-gray-600 hover:bg-gray-50`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 mt-3 pt-3">
                {status === "authenticated" ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
                    >
                      <Coins className="w-4 h-4" />
                      Dashboard ({displayCredits} credits)
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => { signOut(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/signin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl text-center border border-gray-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full px-4 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}