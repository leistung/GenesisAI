"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Crown, Zap } from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const monthlyPlans = [
    {
      name: "free",
      displayName: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 10,
      creditLabel: "/day",
      features: ["10 credits / day", "Basic models", "Community support", "Watermarked images"],
    },
    {
      name: "premium",
      displayName: "Premium",
      monthlyPrice: 9.99,
      yearlyPrice: 95.88,
      credits: 2000,
      creditLabel: "/month",
      features: ["2,000 credits / month", "All models", "Priority queue", "No watermark", "AI Image Editor"],
    },
    {
      name: "ultimate",
      displayName: "Ultimate",
      monthlyPrice: 19.99,
      yearlyPrice: 191.88,
      credits: 5000,
      creditLabel: "/month",
      features: ["5,000 credits / month", "All models", "Highest priority", "No watermark", "Instant AI Editor", "Early access to new features"],
    },
  ];

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
          {monthlyPlans.map((plan) => {
            const isCurrentPlan = session?.user?.subscriptionTier === plan.name;
            const displayPrice = billingCycle === "yearly" ? plan.yearlyPrice / 12 : plan.monthlyPrice;
            const totalPrice = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

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
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          ${displayPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-600">/month</span>
                        {billingCycle === "yearly" && (
                          <div className="text-sm text-gray-400 mt-1">
                            ${totalPrice.toFixed(2)}/year billed annually
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>
                      {plan.credits.toLocaleString()} credits{plan.creditLabel}
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
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : plan.name === "premium"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : plan.name === "ultimate"
                        ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {isCurrentPlan ? "Current Plan" : plan.monthlyPrice === 0 ? "Get Started Free" : "Subscribe"}
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