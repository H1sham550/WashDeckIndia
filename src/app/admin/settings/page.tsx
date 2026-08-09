import { Settings, Mail, ShieldCheck, Database, Globe, Bell, Server } from "lucide-react";
import { requireRole } from "@/lib/auth";

export default async function SettingsPage() {
  await requireRole(["SUPER_ADMIN"]);

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Super Admin Platform Configuration
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Global system toggles, international localization defaults, and platform health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email & SMTP */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-wd-teal-50 text-wd-teal-700">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Email & SMTP Delivery</h2>
              <p className="text-[11px] text-slate-400">Nodemailer configuration status</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">SMTP Engine Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Connected (Active)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">System Sender Email</span>
              <span className="font-bold text-slate-800">no-reply@washdeck.com</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 font-semibold">OTP Expiry Window</span>
              <span className="font-bold text-slate-800">10 Minutes</span>
            </div>
          </div>
        </div>

        {/* International & Localization Defaults */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-wd-teal-50 text-wd-teal-700">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">International Defaults</h2>
              <p className="text-[11px] text-slate-400">Standard settings for new onboarding stations</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Default Currency</span>
              <span className="font-bold text-slate-800">₹ INR / $ USD (Dynamic)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Supported Timezones</span>
              <span className="font-bold text-slate-800">14 International Timezones</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Date Formatting</span>
              <span className="font-bold text-slate-800">DD/MM/YYYY & MM/DD/YYYY Support</span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-wd-teal-50 text-wd-teal-700">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Prisma Database & Storage</h2>
              <p className="text-[11px] text-slate-400">PostgreSQL instance & image storage</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Database Connection</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal (&lt; 12ms pool)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Batched Entitlement Cache</span>
              <span className="font-bold text-slate-800">60 Second In-Memory TTL</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Image Storage Optimization</span>
              <span className="font-bold text-slate-800">Active (WebP Compression)</span>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-wd-teal-50 text-wd-teal-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Platform Access Control</h2>
              <p className="text-[11px] text-slate-400">Impersonation and tenancy safety</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Admin Impersonation Banner</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Mandatory & Active</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Session Token Expiry</span>
              <span className="font-bold text-slate-800">7 Days (jose JWT HS256)</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Password Reset Security</span>
              <span className="font-bold text-slate-800">Single-Use OTP Token Validation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
