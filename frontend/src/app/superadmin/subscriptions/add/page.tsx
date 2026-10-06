"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, DollarSign, RefreshCcw, FileText } from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import CurrencySelect from "@/components/CurrencySelect";
import FormSectionHeader from "@/components/FormSectionHeader";
import { formatPrice, formatBilling } from "@/lib/subscriptionFormat";

const inputClass =
    "box-border w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-900 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 hover:border-gray-400 hover:bg-gray-50/70 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-500";

export default function AddSubscriptionPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const saved = localStorage.getItem("superAdminSidebarCollapsed");
        if (saved === "true") setSidebarCollapsed(true);

        const handleSidebarToggle = (e: CustomEvent) => {
            setSidebarCollapsed(e.detail.collapsed);
        };

        window.addEventListener("superAdminSidebarToggle", handleSidebarToggle as EventListener);
        return () => window.removeEventListener("superAdminSidebarToggle", handleSidebarToggle as EventListener);
    }, []);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        price: "",
        currency: "EUR",
        interval: "month",
        interval_count: "1",
        description: "",
        is_active: true,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Plan name is required.";
        if (!form.slug.trim()) newErrors.slug = "Slug is required.";
        if (!form.price.trim()) newErrors.price = "Price is required.";
        if (!form.interval_count.trim() || Number(form.interval_count) < 1) {
            newErrors.interval_count = "Interval count must be at least 1.";
        }
        return newErrors;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);

        api
            .post("/superadmin/subscription", {
                ...form,
                price: Number(form.price),
                interval_count: Number(form.interval_count),
            })
            .then(() => {
                router.push("/superadmin/subscriptions?added=true");
            })
            .catch((err) => {
                if (err.response?.status === 422 && err.response?.data?.errors) {
                    const apiErrors: Record<string, string> = {};
                    Object.entries(err.response.data.errors).forEach(([key, val]) => {
                        apiErrors[key] = Array.isArray(val) ? (val[0] as string) : String(val);
                    });
                    setErrors(apiErrors);
                } else {
                    alert(err.response?.data?.message || "Failed to create subscription plan");
                }
            })
            .finally(() => {
                setSaving(false);
            });
    };

    return (
        <div className="superadmin-layout">
            <SuperAdminSidebar />
            <main className={`superadmin-main-content ${sidebarCollapsed ? "sidebar-collapsed-main" : "sidebar-expanded-main"}`}>
                <div className="mx-auto max-w-5xl w-full space-y-6 pt-12 lg:pt-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
                        <div className="pl-px">
                            <h1 className="text-2xl font-bold text-gray-900">Add New Subscription Plan</h1>
                            <p className="mt-1 text-sm text-gray-500">Create a new billing plan that restaurants can subscribe to.</p>
                        </div>
                        <Link
                            href="/superadmin/subscriptions"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-violet-700"
                        >
                            <ArrowLeft size={15} />
                            Back to Subscriptions
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-3">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<Tag size={17} />} title="Plan Identity" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Plan Name *</label>
                                    <input
                                        name="name"
                                        autoComplete="off"
                                        placeholder="e.g. Pro Monthly"
                                        value={form.name}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Slug *</label>
                                    <input
                                        name="slug"
                                        autoComplete="off"
                                        placeholder="e.g. pro-monthly"
                                        value={form.slug}
                                        onChange={handleChange}
                                        className={`${inputClass} font-mono ${errors.slug ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<DollarSign size={17} />} title="Pricing & Billing Cycle" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="price"
                                        autoComplete="off"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.price ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Currency *</label>
                                    <CurrencySelect
                                        value={form.currency}
                                        onChange={(code) => setForm((prev) => ({ ...prev, currency: code }))}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Billing Interval *</label>
                                    <select name="interval" value={form.interval} onChange={handleChange} className={inputClass}>
                                        <option value="month">Monthly</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Interval Count *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        name="interval_count"
                                        autoComplete="off"
                                        value={form.interval_count}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.interval_count ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.interval_count && <p className="mt-1 text-xs text-red-600">{errors.interval_count}</p>}
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Preview</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatPrice(form.price, form.currency)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {formatBilling(form.interval, Number(form.interval_count) || 1)}
                                </span>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<FileText size={17} />} title="Additional Details" />
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="Optional description for this plan..."
                                        value={form.description}
                                        onChange={handleChange}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                                            <RefreshCcw size={15} />
                                        </span>
                                        <div>
                                            <p className="m-0 text-sm font-semibold text-gray-800">Plan Active</p>
                                            <p className="m-0 text-xs text-gray-500">Inactive plans are hidden from restaurants.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.is_active}
                                        onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`box-border relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${form.is_active ? "bg-violet-600" : "bg-gray-300"
                                            }`}
                                    >
                                        <span
                                            className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${form.is_active ? "translate-x-5" : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href="/superadmin/subscriptions"
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 no-underline hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
                            >
                                {saving ? "Creating..." : "Create Subscription"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
