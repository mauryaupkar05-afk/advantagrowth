"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { User, Lock, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";

const inputClass =
    "box-border w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50/70 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-500";

export default function SuperAdminProfilePage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [profileForm, setProfileForm] = useState({ owner_name: "", email: "" });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileMessage, setProfileMessage] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [passwordMessage, setPasswordMessage] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("superAdminSidebarCollapsed");
        if (saved === "true") setSidebarCollapsed(true);

        const handleSidebarToggle = (e: CustomEvent) => {
            setSidebarCollapsed(e.detail.collapsed);
        };

        window.addEventListener("superAdminSidebarToggle", handleSidebarToggle as EventListener);
        return () => window.removeEventListener("superAdminSidebarToggle", handleSidebarToggle as EventListener);
    }, []);

    useEffect(() => {
        api
            .get("/auth/me")
            .then((res) => {
                setProfileForm({
                    owner_name: res.data.owner_name || "",
                    email: res.data.email || "",
                });
            })
            .catch((err) => {
                console.error("Failed to load profile:", err);
                setLoadError(err.response?.data?.message || "Failed to load profile data.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
        if (profileErrors[e.target.name]) {
            setProfileErrors((prev) => {
                const next = { ...prev };
                delete next[e.target.name];
                return next;
            });
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
        if (passwordErrors[e.target.name]) {
            setPasswordErrors((prev) => {
                const next = { ...prev };
                delete next[e.target.name];
                return next;
            });
        }
    };

    const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileMessage("");

        const newErrors: Record<string, string> = {};
        if (!profileForm.owner_name.trim()) newErrors.owner_name = "Name is required.";
        if (!profileForm.email.trim()) newErrors.email = "Email is required.";
        if (Object.keys(newErrors).length > 0) {
            setProfileErrors(newErrors);
            return;
        }

        setProfileSaving(true);
        api
            .put("/auth/profile", profileForm)
            .then(() => {
                setProfileMessage("Profile updated successfully.");
                setTimeout(() => setProfileMessage(""), 4000);
            })
            .catch((err) => {
                if (err.response?.status === 422 && err.response?.data?.errors) {
                    const apiErrors: Record<string, string> = {};
                    Object.entries(err.response.data.errors).forEach(([key, val]) => {
                        apiErrors[key] = Array.isArray(val) ? (val[0] as string) : String(val);
                    });
                    setProfileErrors(apiErrors);
                } else {
                    alert(err.response?.data?.message || "Failed to update profile");
                }
            })
            .finally(() => setProfileSaving(false));
    };

    const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordMessage("");

        const newErrors: Record<string, string> = {};
        if (!passwordForm.current_password) newErrors.current_password = "Current password is required.";
        if (!passwordForm.new_password) newErrors.new_password = "New password is required.";
        else if (passwordForm.new_password.length < 6) newErrors.new_password = "New password must be at least 6 characters.";
        if (passwordForm.new_password_confirmation !== passwordForm.new_password) {
            newErrors.new_password_confirmation = "Passwords do not match.";
        }
        if (Object.keys(newErrors).length > 0) {
            setPasswordErrors(newErrors);
            return;
        }

        setPasswordSaving(true);
        api
            .put("/auth/change-password", passwordForm)
            .then(() => {
                setPasswordMessage("Password updated successfully.");
                setTimeout(() => setPasswordMessage(""), 4000);
                setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
            })
            .catch((err) => {
                if (err.response?.status === 422 && err.response?.data?.errors) {
                    const apiErrors: Record<string, string> = {};
                    Object.entries(err.response.data.errors).forEach(([key, val]) => {
                        apiErrors[key] = Array.isArray(val) ? (val[0] as string) : String(val);
                    });
                    setPasswordErrors(apiErrors);
                } else {
                    setPasswordErrors({ current_password: err.response?.data?.message || "Failed to update password" });
                }
            })
            .finally(() => setPasswordSaving(false));
    };

    return (
        <div className="superadmin-layout">
            <SuperAdminSidebar />
            <main className={`superadmin-main-content ${sidebarCollapsed ? "sidebar-collapsed-main" : "sidebar-expanded-main"}`}>
                <div className="mx-auto max-w-5xl w-full space-y-6 pt-12 lg:pt-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
                        <div className="pl-px">
                            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage your account details and password.</p>
                        </div>
                        <Link
                            href="/superadmin/dashboard"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-violet-700"
                        >
                            <ArrowLeft size={15} />
                            Back to Dashboard
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[40vh] items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {loadError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {loadError}
                                </div>
                            )}
                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                        <User size={17} />
                                    </span>
                                    <h2 className="text-sm font-semibold text-gray-800">Profile Information</h2>
                                </div>

                                <form onSubmit={handleProfileSubmit} noValidate className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Full Name</label>
                                        <input
                                            name="owner_name"
                                            autoComplete="off"
                                            value={profileForm.owner_name}
                                            onChange={handleProfileChange}
                                            className={`${inputClass} ${profileErrors.owner_name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        {profileErrors.owner_name && <p className="mt-1 text-xs text-red-600">{profileErrors.owner_name}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            className={`${inputClass} ${profileErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        {profileErrors.email && <p className="mt-1 text-xs text-red-600">{profileErrors.email}</p>}
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={profileSaving}
                                            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {profileSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                        {profileMessage && (
                                            <span className="text-sm font-medium text-green-600">{profileMessage}</span>
                                        )}
                                    </div>
                                </form>
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                        <Lock size={17} />
                                    </span>
                                    <h2 className="text-sm font-semibold text-gray-800">Update Password</h2>
                                </div>

                                <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Current Password</label>
                                        <input
                                            type="password"
                                            name="current_password"
                                            autoComplete="off"
                                            value={passwordForm.current_password}
                                            onChange={handlePasswordChange}
                                            className={`${inputClass} ${passwordErrors.current_password ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        {passwordErrors.current_password && <p className="mt-1 text-xs text-red-600">{passwordErrors.current_password}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>New Password</label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            autoComplete="off"
                                            value={passwordForm.new_password}
                                            onChange={handlePasswordChange}
                                            className={`${inputClass} ${passwordErrors.new_password ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        {passwordErrors.new_password && <p className="mt-1 text-xs text-red-600">{passwordErrors.new_password}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="new_password_confirmation"
                                            autoComplete="off"
                                            value={passwordForm.new_password_confirmation}
                                            onChange={handlePasswordChange}
                                            className={`${inputClass} ${passwordErrors.new_password_confirmation ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        {passwordErrors.new_password_confirmation && <p className="mt-1 text-xs text-red-600">{passwordErrors.new_password_confirmation}</p>}
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={passwordSaving}
                                            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {passwordSaving ? "Updating..." : "Update Password"}
                                        </button>
                                        {passwordMessage && (
                                            <span className="text-sm font-medium text-green-600">{passwordMessage}</span>
                                        )}
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
