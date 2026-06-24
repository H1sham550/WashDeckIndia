"use client";

import React, { useState, useTransition } from "react";
import {
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Clock,
  Sparkles,
  Award,
  AlertTriangle,
  History,
  FileText,
  Plus,
  Loader2,
  ChevronLeft,
  Tag,
  X,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";

type VehiclePassportViewProps = {
  userRole: string;
  passport: {
    vehicle: {
      id: string;
      vehicleNumber: string;
      vehicleType: string;
      brand: string | null;
      model: string | null;
      color: string | null;
      tags: string[];
      contacts: Array<{
        isPrimary: boolean;
        customer: {
          name: string;
          mobile: string;
          email: string | null;
        };
      }>;
      notes: Array<{
        id: string;
        type: string;
        content: string;
        createdAt: string | Date;
        author: {
          name: string;
        };
      }>;
      offerProgress: Array<{
        id: string;
        currentCount: number;
        rewardEarned: boolean;
        rewardRedeemed: boolean;
        offer: {
          id: string;
          name: string;
          targetCount: number;
          rewardDescription: string;
        };
      }>;
    };
    metrics: {
      totalVisits: number;
      totalSpend: number;
      lastVisit: string;
      averageVisitFrequency: string;
      expectedNextVisit: string;
      favouriteService: string;
      vipStatus: string;
      dueStatus: string;
    };
    timeline: Array<{
      id: string;
      type: "job" | "payment" | "note" | "report";
      status?: string;
      noteType?: string;
      date: string | Date;
      description: string;
      meta?: {
        services?: Array<{ name: string; price: number }>;
        invoice?: { amount: number; status: string } | null;
        report?: { secureSlug: string; createdAt: string | Date } | null;
        secureSlug?: string;
      };
    }>;
  };
};

export function VehiclePassportView({ userRole, passport }: VehiclePassportViewProps) {
  const { vehicle, metrics, timeline: initialTimeline } = passport;
  const primaryContact = vehicle.contacts?.find((c) => c.isPrimary)?.customer || vehicle.contacts?.[0]?.customer;

  const [notes, setNotes] = useState(vehicle.notes || []);
  const [timeline, setTimeline] = useState(initialTimeline || []);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("GENERAL");
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<"ALL" | "GENERAL" | "WARNING" | "PREFERENCE" | "VIP">("ALL");
  const [isPending, startTransition] = useTransition();
  const [noteError, setNoteError] = useState("");

  // Tags State
  const [tags, setTags] = useState<string[]>(vehicle.tags || []);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Loyalty Offers State
  const [offerProgress, setOfferProgress] = useState(vehicle.offerProgress || []);

  const isOwner = userRole === "OWNER";

  const filteredNotes = selectedNoteCategory === "ALL"
    ? notes
    : notes.filter((n) => n.type === selectedNoteCategory);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setNoteError("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicle.id}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: newNoteType,
            content: newNoteContent,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to add note.");
        }

        const addedNote = result.note;
        setNotes((prev) => [addedNote, ...prev]);

        // Inject note into timeline locally
        setTimeline((prev) => [
          {
            id: addedNote.id,
            type: "note",
            noteType: addedNote.type,
            date: new Date(addedNote.createdAt),
            description: `Note added by ${addedNote.author.name}: "${addedNote.content}"`,
          },
          ...prev,
        ]);

        setNewNoteContent("");
      } catch (err: any) {
        setNoteError(err.message || "Could not add note.");
      }
    });
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: newTag.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to add tag.");
      }
      setTags(data.tags);
      setNewTag("");
      setShowTagInput(false);
    } catch (err: any) {
      alert(err.message || "Failed to add tag.");
    }
  }

  async function handleRemoveTag(tagToRemove: string) {
    if (!confirm(`Are you sure you want to remove the tag "${tagToRemove}"?`)) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/tags?tag=${encodeURIComponent(tagToRemove)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to remove tag.");
      }
      setTags(data.tags);
    } catch (err: any) {
      alert(err.message || "Failed to remove tag.");
    }
  }

  async function handleRedeemReward(progressId: string) {
    if (!confirm("Are you sure you want to redeem this loyalty reward?")) return;

    try {
      const res = await fetch("/api/offers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to redeem reward.");
      }

      setOfferProgress((prev) =>
        prev.map((op) =>
          op.id === progressId
            ? { ...op, currentCount: 0, rewardEarned: false, rewardRedeemed: true }
            : op
        )
      );

      alert("Loyalty reward redeemed successfully! Progress has been reset.");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Could not redeem reward.");
    }
  }

  const getNoteStyle = (type: string) => {
    switch (type) {
      case "WARNING":
        return "bg-rose-50 border-rose-200 text-rose-800";
      case "VIP":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "PREFERENCE":
        return "bg-sky-50 border-sky-200 text-sky-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  const getJobBadgeColor = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-800";
      case "SERVICE_COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "PAYMENT_PENDING":
        return "bg-rose-100 text-rose-800";
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800";
      case "CANCELLED":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft size={16} />
          Back to Queue
        </Link>
        <Link
          href={`/dashboard/jobs/new?vehicleId=${vehicle.id}`}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-white text-sm font-bold px-4 hover:brightness-95 transition shadow-sm"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          <Plus size={16} />
          Create Job Card
        </Link>
      </div>

      {/* Vehicle Profile Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-wide uppercase">
              {vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
            </h1>
            {metrics.vipStatus === "VIP" && (
              <span className="flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm animate-pulse">
                <Award size={14} />
                VIP CLIENT
              </span>
            )}
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
              metrics.dueStatus === "Overdue"
                ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold"
                : metrics.dueStatus === "Due Soon"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              {metrics.dueStatus === "Overdue" ? "🚨 Overdue for Visit" : metrics.dueStatus === "Due Soon" ? "⏳ Due Soon" : "✅ Active Client"}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-2">
            <span className="font-bold text-slate-700 capitalize">{vehicle.vehicleType.toLowerCase()}</span>
            {vehicle.brand && (
              <>
                <span>•</span>
                <span>{vehicle.brand} {vehicle.model}</span>
              </>
            )}
            {vehicle.color && (
              <>
                <span>•</span>
                <span>{vehicle.color}</span>
              </>
            )}
          </p>

          {/* Vehicle Tags Section */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mr-1">
              <Tag size={12} /> Tags:
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
              >
                {tag}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 transition text-slate-400 ml-0.5"
                    title="Remove Tag"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}

            {isOwner && (
              <div className="inline-block relative">
                {showTagInput ? (
                  <form onSubmit={handleAddTag} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Tag name"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="h-7 w-28 text-[11px] px-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    />
                    <button
                      type="submit"
                      className="h-7 px-2.5 rounded bg-[var(--primary-color)] text-white text-[10px] font-bold hover:brightness-95"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTagInput(false);
                        setNewTag("");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 transition"
                  >
                    <Plus size={10} /> Add Tag
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculated Metrics Strip */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {[
          ["Total Visits", metrics.totalVisits, History],
          ["Total Spend", `₹${metrics.totalSpend}`, IndianRupee],
          ["Last Visit", metrics.lastVisit, Calendar],
          ["Average Frequency", metrics.averageVisitFrequency, Clock],
          ["Expected Return", metrics.expectedNextVisit, Calendar],
          ["Fav Service", metrics.favouriteService, Sparkles],
          ["VIP Status", metrics.vipStatus, Award],
        ].map(([label, value, IconComponent]) => {
          const Icon = IconComponent as any;
          return (
            <div key={label as string} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400">
                <Icon size={18} className="text-[var(--primary-color)]" />
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label as string}</p>
                <p className="text-lg font-bold text-slate-800 mt-1 truncate">{value as string}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px]">
        {/* Left Side: Timeline and Notes */}
        <div className="space-y-6">
          {/* Notes Section */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
              <FileText size={18} className="text-[var(--primary-color)]" />
              Vehicle Pass Notes (Append-only)
            </h3>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {noteError && <p className="text-xs text-red-600 font-semibold">{noteError}</p>}
              <textarea
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Type important customer requests, preferences, or warnings here..."
                className="w-full h-20 border rounded-lg p-3 text-sm outline-none focus:border-[var(--primary-color)] bg-white resize-none"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  {["GENERAL", "WARNING", "PREFERENCE", "VIP"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewNoteType(type)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border transition-all ${
                        newNoteType === type
                          ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {type.toLowerCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-9 items-center justify-center px-4 rounded-lg text-white text-xs font-bold hover:brightness-95 disabled:opacity-50 transition"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  {isPending ? <Loader2 className="animate-spin" size={14} /> : "Save Note"}
                </button>
              </div>
            </form>

            {/* Notes List with filters */}
            <div className="space-y-3">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b pb-3">
                {["ALL", "GENERAL", "WARNING", "PREFERENCE", "VIP"].map((cat) => {
                  const count = cat === "ALL" ? notes.length : notes.filter((n) => n.type === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedNoteCategory(cat as any)}
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        selectedNoteCategory === cat
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.toLowerCase()} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((n) => (
                    <div key={n.id} className={`p-4 border rounded-xl text-sm ${getNoteStyle(n.type)}`}>
                      <div className="flex justify-between text-xs font-bold opacity-70 mb-1.5">
                        <span>{n.author.name}</span>
                        <span>
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="leading-relaxed font-medium">{n.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6">No {selectedNoteCategory.toLowerCase()} notes saved.</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3">Service & Notes History</h3>

            <div className="relative pl-6 border-l-2 border-slate-150 space-y-8">
              {timeline.length > 0 ? (
                timeline.map((event, idx) => {
                  const dateStr = new Date(event.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border bg-white flex items-center justify-center">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            event.type === "job"
                              ? event.status === "CANCELLED" ? "bg-slate-400" : "bg-teal-600"
                              : event.type === "payment"
                              ? "bg-emerald-500"
                              : event.type === "report"
                              ? "bg-purple-500"
                              : "bg-amber-400"
                          }`}
                        />
                      </span>

                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-400">{dateStr}</span>
                          {event.status && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getJobBadgeColor(event.status)}`}>
                              {event.status.replace("_", " ").toLowerCase()}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-800 mt-1">{event.description}</p>

                        {/* Additional Meta details */}
                        {event.meta && (
                          <div className="mt-2 text-xs bg-slate-50 border rounded-lg p-3 space-y-1">
                            {event.meta.services && event.meta.services.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {event.meta.services.map((s, sIdx) => (
                                  <span key={sIdx} className="bg-white px-2.5 py-1 border rounded-md font-medium text-slate-700">
                                    {s.name} (₹{s.price})
                                  </span>
                                ))}
                              </div>
                            )}
                            {event.meta.invoice && (
                              <div className="text-slate-500 flex items-center gap-1.5 pt-1">
                                <span>Invoice:</span>
                                <span className="font-bold text-slate-700">₹{event.meta.invoice.amount}</span>
                                <span className={`text-[10px] font-extrabold uppercase px-1.5 rounded-md ${
                                  event.meta.invoice.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {event.meta.invoice.status}
                                </span>
                              </div>
                            )}
                            {event.meta.report && (
                              <div className="pt-1.5 flex items-center justify-between border-t mt-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">REPORT GENERATED</span>
                                <Link
                                  href={`/reports/${event.meta.report.secureSlug}`}
                                  target="_blank"
                                  className="text-[10px] font-extrabold text-[var(--primary-color)] hover:underline flex items-center gap-0.5"
                                >
                                  View Service Report
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {event.type === "report" && event.meta?.secureSlug && (
                          <div className="mt-2 text-xs">
                            <Link
                              href={`/reports/${event.meta.secureSlug}`}
                              target="_blank"
                              className="text-xs font-bold text-[var(--primary-color)] hover:underline"
                            >
                              Open Report View
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-4">No historical visits logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Customer & Offers Panel */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Primary Contact</h3>
            {primaryContact ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Customer Name</p>
                  <p className="font-bold text-slate-800 mt-0.5">{primaryContact.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-700">{primaryContact.mobile}</span>
                </div>
                {primaryContact.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700 truncate">{primaryContact.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No primary contact linked to this vehicle.</p>
            )}
          </div>

          {/* Active Offers Progress */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Active Offers</h3>
            {offerProgress && offerProgress.length > 0 ? (
              <div className="space-y-4">
                {offerProgress.map((op) => {
                  const progressPct = Math.min((op.currentCount / op.offer.targetCount) * 100, 100);
                  const isUnlocked = op.currentCount >= op.offer.targetCount;
                  return (
                    <div key={op.id} className="border rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{op.offer.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{op.offer.rewardDescription}</p>
                        </div>
                        {isUnlocked && !op.rewardRedeemed && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                            Reward Available
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span>{op.currentCount} / {op.offer.targetCount} stamps</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: isUnlocked ? "#10b981" : "var(--primary-color)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Reward Redemption Actions */}
                      {isUnlocked && !op.rewardRedeemed && (
                        <button
                          onClick={() => handleRedeemReward(op.id)}
                          className="w-full mt-2 h-9 text-xs font-bold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                        >
                          <FileCheck2 size={14} />
                          Redeem Reward Now
                        </button>
                      )}

                      {op.rewardRedeemed && (
                        <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg text-center">
                          ✓ Reward Redeemed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active loyalty offers tracking for this vehicle.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
