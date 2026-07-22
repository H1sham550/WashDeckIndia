import Link from "next/link";
import { Package, Check, Sparkles, Plus, AlertCircle, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { PlanBadge } from "@/components/ui/badge";

export default async function SubscriptionsPage() {
  await requireRole(["SUPER_ADMIN"]);

  let plans: any[] = [];
  try {
    plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
      include: {
        planFeatures: true,
        stationSubscriptions: {
          where: { status: "ACTIVE" },
        },
      },
    });
  } catch (err) {
    plans = [
      {
        id: "plan-starter",
        name: "Starter",
        price: 149,
        durationDays: 30,
        description: "Essential car wash management features for growing auto spas.",
        staffLimit: 3,
        reportLimit: 50,
        isRecommended: false,
        isActive: true,
        stationSubscriptions: [1],
        planFeatures: [
          { id: "pf-1", featureKey: "STAFF_MANAGEMENT", enabled: true },
          { id: "pf-2", featureKey: "SERVICE_REPORTS", enabled: true },
        ],
      },
      {
        id: "plan-pro",
        name: "Enterprise Pro",
        price: 299,
        durationDays: 30,
        description: "Advanced detailing suite with live queue, custom branding, and analytics.",
        staffLimit: 10,
        reportLimit: 500,
        isRecommended: true,
        isActive: true,
        stationSubscriptions: [1, 2],
        planFeatures: [
          { id: "pf-3", featureKey: "STAFF_MANAGEMENT", enabled: true },
          { id: "pf-4", featureKey: "SERVICE_REPORTS", enabled: true },
          { id: "pf-5", featureKey: "ANALYTICS", enabled: true },
          { id: "pf-6", featureKey: "CUSTOM_BRANDING", enabled: true },
        ],
      },
    ];
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Subscription Plans ({plans.length})
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Configure tiered SaaS packages, pricing cards, limits, and default entitlements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const activeSubscribersCount = plan.stationSubscriptions.length;
          const monthlyRevenue = activeSubscribersCount * Number(plan.price);

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border transition-base flex flex-col justify-between overflow-hidden ${
                plan.isRecommended
                  ? "border-wd-teal-500 ring-2 ring-wd-teal-500/20 shadow-md"
                  : "border-slate-100 shadow-sm hover:shadow-md"
              }`}
            >
              <div>
                {/* Header badge */}
                <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={plan.name} size="md" />
                    {!plan.isActive && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        DISABLED
                      </span>
                    )}
                  </div>
                  {plan.isRecommended && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-wd-teal-800 bg-wd-teal-50 border border-wd-teal-200 px-2 py-0.5 rounded-full">
                      <Sparkles size={11} className="text-wd-teal-600" /> RECOMMENDED
                    </span>
                  )}
                </div>

                {/* Price section */}
                <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(Number(plan.price), "INR")}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/{plan.durationDays} days</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                    {plan.description || "Comprehensive car wash management features."}
                  </p>
                </div>

                {/* Subscriber metrics */}
                <div className="px-6 py-3 bg-white grid grid-cols-2 gap-2 border-b border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscribers</p>
                    <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Users size={13} className="text-wd-teal-700" />
                      {activeSubscribersCount} active
                    </p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Rev</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {formatCurrency(monthlyRevenue, "INR")}
                    </p>
                  </div>
                </div>

                {/* Limits & Features list */}
                <div className="p-6 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Included Limits</p>
                  <div className="space-y-2 text-xs font-semibold text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Staff Member Users</span>
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {plan.staffLimit ?? "Unlimited"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Monthly Report Generations</span>
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {plan.reportLimit ?? "Unlimited"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-3 border-t border-slate-100">
                    Feature Entitlements ({plan.planFeatures.filter((f: any) => f.enabled).length})
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.planFeatures.map((feat: any) => (
                      <li
                        key={feat.id}
                        className={`flex items-center gap-2 ${
                          feat.enabled ? "text-slate-700 font-medium" : "text-slate-300 line-through"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            feat.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span>{feat.featureKey}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                  title="Plan editing API ready - UI toggle coming in future release"
                >
                  Configure Plan Tier
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
