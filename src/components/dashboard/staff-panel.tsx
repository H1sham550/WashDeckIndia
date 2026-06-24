"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, Pencil, Key, ShieldAlert, UserCheck, UserX, Loader2, AlertCircle, CheckCircle2, User } from "lucide-react";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
};

type Limits = {
  planName: string;
  allowedStaff: number;
  usedStaff: number;
};

type StaffPanelProps = {
  initialStaff: StaffUser[];
  limits: Limits;
};

export function StaffPanel({ initialStaff, limits: initialLimits }: StaffPanelProps) {
  const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
  const [limits, setLimits] = useState<Limits>(initialLimits);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "STAFF",
    password: "",
  });

  const [resetPasswordVal, setResetPasswordVal] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLimitReached = limits.usedStaff >= limits.allowedStaff;

  function openAddModal() {
    if (isLimitReached) return;
    setError("");
    setSuccess("");
    setFormData({
      name: "",
      email: "",
      mobile: "",
      role: "STAFF",
      password: "",
    });
    setAddModalOpen(true);
  }

  function openEditModal(member: StaffUser) {
    setError("");
    setSuccess("");
    setSelectedStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      mobile: member.mobile,
      role: member.role,
      password: "", // Not used in edit
    });
    setEditModalOpen(true);
  }

  function openResetPasswordModal(member: StaffUser) {
    setError("");
    setSuccess("");
    setSelectedStaff(member);
    setResetPasswordVal("");
    setResetPasswordModalOpen(true);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to add staff member.");
        }

        const newUser = result.user;
        setStaff((prev) => [newUser, ...prev]);
        setLimits((prev) => ({ ...prev, usedStaff: prev.usedStaff + 1 }));
        setSuccess(`Staff member ${newUser.name} created successfully!`);
        setAddModalOpen(false);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  async function handleEditStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/staff/${selectedStaff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            mobile: formData.mobile,
            role: formData.role,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to update staff profile.");
        }

        const updatedUser = result.user;
        setStaff((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
        setSuccess(`Staff member ${updatedUser.name} updated successfully!`);
        setEditModalOpen(false);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  async function handleToggleStatus(member: StaffUser) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const statusLabel = nextStatus === "ACTIVE" ? "activated" : "disabled";

    if (!confirm(`Are you sure you want to change status to ${nextStatus === "ACTIVE" ? "ACTIVE" : "DISABLED"} for ${member.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to toggle status.");
      }

      setStaff((prev) => prev.map((u) => (u.id === member.id ? { ...u, status: nextStatus } : u)));
      alert(`Staff member ${member.name} has been ${statusLabel}.`);
    } catch (err: any) {
      alert(err.message || "Failed to update staff status.");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff || !resetPasswordVal) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/staff/${selectedStaff.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "password-reset",
            password: resetPasswordVal,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to reset password.");
        }

        setSuccess(`Password for ${selectedStaff.name} has been reset. The staff will be forced to change this password on next login.`);
        setResetPasswordModalOpen(false);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Subscription stats & Add button */}
      <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {limits.planName}
            </span>
            <span className="text-xs font-semibold text-slate-500">Allowed Staff: {limits.allowedStaff}</span>
          </div>
          <p className="text-sm font-bold text-slate-700">
            Registered: <span className="text-lg font-extrabold text-[var(--primary-color)]">{limits.usedStaff}</span> / {limits.allowedStaff} staff users
          </p>
          {isLimitReached && (
            <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
              <ShieldAlert size={14} />
              Staff limit reached. Upgrade your plan to add more users.
            </p>
          )}
        </div>

        <button
          onClick={openAddModal}
          disabled={isLimitReached}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-white text-xs font-bold px-5 transition shadow-sm hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          <Plus size={16} />
          Register Staff
        </button>
      </div>

      {/* Staff Grid/Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      {member.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{member.mobile || "—"}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md border font-extrabold uppercase ${
                        member.role === "OWNER"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${
                        member.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {member.status === "ACTIVE" ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400">
                      {member.lastLogin ? (
                        new Date(member.lastLogin).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="italic text-slate-300">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(member)}
                          title="Edit Profile"
                          className="h-8 w-8 rounded-lg border text-slate-400 hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all bg-white flex items-center justify-center"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(member)}
                          title="Reset Password"
                          className="h-8 w-8 rounded-lg border text-slate-400 hover:text-amber-600 hover:border-amber-600 transition-all bg-white flex items-center justify-center"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          title={member.status === "ACTIVE" ? "Disable User" : "Activate User"}
                          className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all bg-white ${
                            member.status === "ACTIVE"
                              ? "text-rose-400 border-rose-200 hover:text-rose-600 hover:border-rose-600"
                              : "text-emerald-400 border-emerald-200 hover:text-emerald-600 hover:border-emerald-600"
                          }`}
                        >
                          {member.status === "ACTIVE" ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No staff members registered at this station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER STAFF MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Register Staff Operator</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div>
                <label className="mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@washdeck.com"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div>
                <label className="mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                  placeholder="e.g. +91 99999 88888"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPending && <Loader2 className="animate-spin" size={14} />}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Edit Staff Details</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div>
                <label className="mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                  placeholder="+91 99999 88888"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div>
                <label className="mb-1 block">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPending && <Loader2 className="animate-spin" size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Reset Password</h3>
              <button onClick={() => setResetPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Resetting password for <span className="font-bold text-slate-700">{selectedStaff.name}</span>. The user will be logged out of current sessions and forced to change this password upon their next login attempt.
              </p>
              <div>
                <label className="mb-1 block">New Temporary Password *</label>
                <input
                  type="password"
                  required
                  min={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setResetPasswordModalOpen(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPending && <Loader2 className="animate-spin" size={14} />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
