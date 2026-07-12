"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keyBuffer, setKeyBuffer] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Shift+? shows shortcut modal
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Handle 2-key sequence shortcuts starting with 'g' (Go to...)
      const newBuffer = [...keyBuffer, e.key.toLowerCase()].slice(-2);
      setKeyBuffer(newBuffer);

      if (newBuffer[0] === "g") {
        if (newBuffer[1] === "d") { router.push("/admin"); setKeyBuffer([]); }
        else if (newBuffer[1] === "c") { router.push("/admin/customers"); setKeyBuffer([]); }
        else if (newBuffer[1] === "s") { router.push("/admin/subscriptions"); setKeyBuffer([]); }
        else if (newBuffer[1] === "p") { router.push("/admin/payments"); setKeyBuffer([]); }
        else if (newBuffer[1] === "i") { router.push("/admin/invoices"); setKeyBuffer([]); }
        else if (newBuffer[1] === "a") { router.push("/admin/analytics"); setKeyBuffer([]); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyBuffer, router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <Keyboard size={16} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-wd-teal-50 text-wd-teal-700">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Keyboard Shortcuts</h3>
                  <p className="text-[11px] text-slate-400">Accelerate your navigation around WashDeck</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">General & Search</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700 font-semibold">Open Command Palette</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded font-bold text-[10px] text-slate-600 border">Ctrl / Cmd + K</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700 font-semibold">Show Shortcut Cheat Sheet</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded font-bold text-[10px] text-slate-600 border">Shift + ?</kbd>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Navigation (Type 'g' then letter)</p>
                <div className="space-y-2">
                  {[
                    { label: "Go to Dashboard", keys: "G then D" },
                    { label: "Go to Customers", keys: "G then C" },
                    { label: "Go to Subscriptions", keys: "G then S" },
                    { label: "Go to Payments", keys: "G then P" },
                    { label: "Go to Invoices", keys: "G then I" },
                    { label: "Go to Analytics", keys: "G then A" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700 font-semibold">{item.label}</span>
                      <kbd className="px-2 py-1 bg-wd-teal-50 text-wd-teal-800 rounded font-bold text-[10px] border border-wd-teal-200">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
