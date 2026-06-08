"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Crown, Zap } from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [apiPlans, setApiPlans] = useState<Array<{ name: string; displayName: string; price: number; currency: string; credits: number; creemProductId: string; features: string }>>([]);
  const [useApiPlans, setUseApiPlans] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/creem/products");
        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans.length > 0) {
            setApiPlans(data.plans);
            setUseApiPlans(true);
          }
        }
      } catch {
        // Fall back to hardcoded plans
      }
    }
    fetchPlans();
  }, []);

  const hardcodedPlans = [
    {
      name: "free",
      displayName: "Free",
      price: 0,
      currency: "USD",
      credits: 10,
      creemProductId: "",
      features: ["10 credits per day", "Basic model only", "Community support", "Images include watermark"],
    },
    {
      name: "premium",
      displayName: "Premium",
      price: 9.99,
      currency: "USD",
      credits: 2000,
      creemProductId: "prod_premium",
      features: ["2,000 credits per month", "All models included", "Priority queue", "No watermarks", "Fast AI Photo Editor"],
    },
    {
      name: "ultimate",
      displayName: "Ultimate",
      price: 19.99,
      currency: "USD",
      credits: 5000,
      creemProductId: "prod_ultimate",
      features: ["5,000 credits per month", "All models included", "Highest priority queue", "No watermarks", "Instant AI Photo Editor", "Early access to new features"],
    },
  ];

  const plans = useApiPlans
    ? apiPlans.map((p) => ({
        ...p,
        features: (typeof p.features === "string" ? JSON.parse(p.features) : p.features) as string[],
        creemProductId: p.creemProductId || "",
      }))
    : hardcodedPlans;

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Start free, upgrade when you need more
          </p>

          <div className="mt-6 inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly <span className="text-xs opacity-75">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = session?.user?.subscriptionTier === plan.name;

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden ${
                  plan.name === "premium" ? "border-purple-500" : "border-gray-200"
                }`}
              >
                {plan.name === "premium" && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.name !== "free" && <Crown className="w-5 h-5 text-yellow-500" />}
                    <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                  </div>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price.toFixed(2)}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>
                      {plan.credits.toLocaleString()} credits{plan.name === "free" ? "/day" : "/month"}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrentPlan || loadingPlan === plan.name}
                    onClick={async () => {
                      if (plan.price === 0) {
                        router.push("/signin");
                        return;
                      }
                      if (!session) {
                        router.push("/signin?callbackUrl=/pricing");
                        return;
                      }
                      setLoadingPlan(plan.name);
                      try {
                        const res = await fetch("/api/creem/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ productId: plan.creemProductId }),
                        });
                        const data = await res.json();
                        if (data.checkoutUrl) {
                          window.location.href = data.checkoutUrl;
                        }
                      } catch {
                        alert("Failed to start checkout. Please try again.");
                      } finally {
                        setLoadingPlan(null);
                      }
                    }}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : loadingPlan === plan.name
                        ? "bg-gray-300 text-gray-500 cursor-wait"
                        : plan.name === "premium"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : plan.name === "ultimate"
                        ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {loadingPlan === plan.name ? "Processing..." : isCurrentPlan ? "Current Plan" : plan.price === 0 ? "Get Started Free" : "Subscribe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Have questions? Contact us at{" "}
            <a href="mailto:support@example.com" className="text-purple-600 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}