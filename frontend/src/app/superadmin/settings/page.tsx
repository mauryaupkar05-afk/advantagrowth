"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import CurrencySelect from "@/components/CurrencySelect";
import FormSectionHeader from "@/components/FormSectionHeader";

export default function SuperAdminSettingsPage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("INR");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

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
            .get("/superadmin/settings")
            .then((res) => setCurrency(res.data.data.currency))
            .catch((err) => console.error("Failed to load settings:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = () => {
        setSaving(true);
        setMessage("");
        api
            .put("/superadmin/settings", { currency })
            .then(() => {
                setMessage("Settings saved successfully.");
                setTimeout(() => setMessage(""), 4000);
            })
            .catch((err) => {
                alert(err.response?.data?.message || "Failed to save settings");
            })
            .finally(() => setSaving(false));
    };

    return (
        <div className="superadmin-layout">
            <SuperAdminSidebar />
            <main className={`superadmin-main-content ${sidebarCollapsed ? "sidebar-collapsed-main" : "sidebar-expanded-main"}`}>
                <div className="mx-auto max-w-5xl w-full flex min-h-[calc(100vh-140px)] flex-col justify-start space-y-6 pt-12 lg:pt-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="mb-6 border-b border-gray-200 pb-5 pl-px">
                        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                        <p className="mt-1 text-sm text-gray-500">Configure platform-wide preferences.</p>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[30vh] items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                        </div>
                    ) : (
                        <section className="min-h-[460px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<SettingsIcon size={17} />} title="Platform Currency" />

                            <p className="mb-4 text-sm text-gray-500">
                                This currency is used to display revenue figures on the Super Admin dashboard.
                            </p>

                            <div className="max-w-sm">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Currency</label>
                                <CurrencySelect value={currency} onChange={setCurrency} />
                            </div>

                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                {message && <span className="text-sm font-medium text-green-600">{message}</span>}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
