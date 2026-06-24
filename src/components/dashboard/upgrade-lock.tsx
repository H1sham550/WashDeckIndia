import React from "react";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

export type UpgradeLockPlan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  staffLimit: number;
  reportLimit: number;
  features: string[];
};

interface UpgradeLockProps {
  featureName: string;
  currentPlanName: string;
  availablePlans: UpgradeLockPlan[];
  stationId: string;
}

export function UpgradeLock({
  featureName,
  currentPlanName,
  availablePlans,
}: UpgradeLockProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center">
      {/* Locked Icon Container with animations */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-xl animate-pulse" />
        <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/50 shadow-2xl text-teal-400">
          <Lock size={36} className="animate-[bounce_2s_infinite]" />
        </div>
      </div>

      {/* Header Text */}
      <div className="text-center max-w-xl space-y-3 mb-12">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight sm:text-4xl">
          Upgrade Required
        </h2>
        <p className="text-base text-slate-500 font-medium">
          The <span className="text-teal-600 font-bold font-mono">{featureName}</span> feature is not included in your current <span className="font-bold text-slate-800">{currentPlanName}</span> plan.
        </p>
      </div>

      {/* Grid of Plans */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        {availablePlans.map((plan) => (
          <div
            key={plan.id}
            className="relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {plan.name.toLowerCase() === "growth" && (
              <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-extrabold px-3 py-1 uppercase rounded-bl-xl tracking-wider">
                Popular
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-wide uppercase">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 min-h-[32px]">
                  {plan.description || `Unlock premium capabilities for your station.`}
                </p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-slate-400">/month</span>
              </div>

              {/* Limits list */}
              <ul className="space-y-2 border-t pt-4 text-xs font-bold text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                  <span>Up to {plan.staffLimit} Staff Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                  <span>{plan.reportLimit >= 9999 ? "Unlimited" : `${plan.reportLimit} Reports /month`}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                  <span>Dynamic Branding {plan.name.toLowerCase() !== "starter" ? "Enabled" : "Disabled"}</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <a
                href="mailto:support@washdeck.com?subject=Upgrade request - WashDeck"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
              >
                <span>Request Upgrade</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-12 text-center">
        Questions? Contact WashDeck Support at support@washdeck.com
      </p>
    </div>
  );
}
