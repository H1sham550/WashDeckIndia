"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Calendar, History, Car, User, Phone, ExternalLink } from "lucide-react";

type RecoveryItem = {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  customerName: string;
  customerMobile: string;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  averageIntervalDays: number;
};

type RecoveryDashboardProps = {
  dueForVisit: RecoveryItem[];
  lostVehicles: RecoveryItem[];
  stationName: string;
};

export function RecoveryDashboard({ dueForVisit, lostVehicles, stationName }: RecoveryDashboardProps) {
  const [activeList, setActiveList] = useState<"due" | "lost">("due");

  const currentList = activeList === "due" ? dueForVisit : lostVehicles;

  function handleReachOut(item: RecoveryItem, type: "due" | "lost") {
    let message = "";
    if (type === "due") {
      message = `Hi ${item.customerName},\n\nHope you're doing well! We noticed your vehicle ${item.vehicleNumber.toUpperCase()} is due for its next wash/service at ${stationName}. Regular maintenance keeps your ride sparkling and protected!\n\nDrop by our station soon for a fresh wash. Let us know if you'd like to book an intake time!`;
    } else {
      message = `Hi ${item.customerName},\n\nWe miss you at ${stationName}! We haven't seen your vehicle ${item.vehicleNumber.toUpperCase()} in over ${item.daysSinceLastVisit} days.\n\nTo welcome you back, we'd love to offer you a special 10% discount on your next Full Spa Wash! Let us know when you'd like to drop in.`;
    }

    let phone = item.customerMobile.replace(/\D/g, "");
    if (phone.length === 10) {
      phone = "91" + phone;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Toggle selector tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveList("due")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeList === "due"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Due For Visit ({dueForVisit.length})
        </button>
        <button
          onClick={() => setActiveList("lost")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeList === "lost"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Lost Vehicles ({lostVehicles.length})
        </button>
      </div>

      {/* Description banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-500 leading-relaxed">
        {activeList === "due" ? (
          <p>
            👉 Listed below are vehicles whose return dates have passed or are approaching, calculated dynamically based on their average visit intervals. Recommended action: Send a friendly service reminder.
          </p>
        ) : (
          <p>
            🚨 Listed below are vehicles that have not visited in over 60 days. They are at risk of being lost to competitors. Recommended action: Offer a retention discount/coupon code.
          </p>
        )}
      </div>

      {/* List items grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {currentList.length > 0 ? (
          currentList.map((item) => (
            <div
              key={item.vehicleId}
              className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all border-l-4 ${
                activeList === "due" ? "border-l-amber-500" : "border-l-rose-500"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800 tracking-wide uppercase">
                      {item.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-slate-100 text-slate-500 uppercase">
                      {item.vehicleType.toLowerCase()}
                    </span>
                  </div>
                  {item.brand && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">
                      {item.brand} {item.model}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">LAST VISIT</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-1 block">
                    {item.daysSinceLastVisit} days ago
                  </span>
                </div>
              </div>

              {/* Client meta */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client</span>
                  <div className="flex items-center gap-1.5 text-slate-700 mt-1 font-semibold">
                    <User size={12} className="text-slate-400" />
                    <span className="truncate">{item.customerName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Visit Cycle</span>
                  <div className="flex items-center gap-1.5 text-slate-700 mt-1 font-semibold">
                    <History size={12} className="text-slate-400" />
                    <span>Every {item.averageIntervalDays} days</span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex justify-between items-center pt-3 border-t">
                <Link
                  href={`/dashboard/vehicles/${item.vehicleId}`}
                  className="text-xs font-bold text-[var(--primary-color)] hover:underline inline-flex items-center gap-1"
                >
                  Open Passport
                  <ExternalLink size={12} />
                </Link>

                <button
                  onClick={() => handleReachOut(item, activeList)}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-white text-xs font-bold px-3 transition shadow-sm ${
                    activeList === "due"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  <MessageSquare size={14} />
                  {activeList === "due" ? "Send Reminder" : "Offer 10% Discount"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 bg-white border rounded-xl p-12 text-center text-slate-400 text-sm">
            No vehicles identified in this list. Excellent customer retention!
          </div>
        )}
      </div>
    </div>
  );
}
