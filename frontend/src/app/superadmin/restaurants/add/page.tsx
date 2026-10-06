"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Phone, MapPin, Clock, Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import CurrencySelect from "@/components/CurrencySelect";
import TimezoneSelect from "@/components/TimezoneSelect";
import FormSectionHeader from "@/components/FormSectionHeader";

const inputClass =
    "box-border w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-900 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 hover:border-gray-400 hover:bg-gray-50/70 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-500";

export default function AddRestaurantPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

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
        legal_name: "",
        business_category: "",
        vat_number: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        postal_code: "",
        country: "",
        phone: "",
        email: "",
        password: "",
        website: "",
        currency: "",
        timezone: "",
        opening_time: "",
        closing_time: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[e.target.name];
                return next;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Restaurant name is required.";
        if (!form.phone.trim()) newErrors.phone = "Phone is required.";
        if (!form.email.trim()) newErrors.email = "Email is required.";
        if (!form.password.trim()) newErrors.password = "Password is required.";
        else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
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
            .post("/superadmin/restaurants", form)
            .then(() => {
                router.push("/superadmin/restaurants?added=true");
            })
            .catch((err) => {
                if (err.response?.data?.errors) {
                    const serverErrors: Record<string, string> = {};
                    Object.entries(err.response.data.errors).forEach(([key, messages]) => {
                        serverErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
                    });
                    setErrors(serverErrors);
                }
                alert(err.response?.data?.message || "Failed to create restaurant");
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
                            <h1 className="text-2xl font-bold text-gray-900">Add Restaurant</h1>
                            <p className="mt-1 text-sm text-gray-500">Onboard a new restaurant onto the platform.</p>
                        </div>
                        <Link
                            href="/superadmin/restaurants"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-violet-700"
                        >
                            <ArrowLeft size={15} />
                            Back to Restaurants
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-3">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<Store size={17} />} title="Basic Information" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Restaurant Name *</label>
                                    <input
                                        name="name"
                                        autoComplete="off"
                                        value={form.name}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Legal Name</label>
                                    <input name="legal_name" autoComplete="off" value={form.legal_name} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Business Category</label>
                                    <input name="business_category" autoComplete="off" value={form.business_category} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>VAT Number</label>
                                    <input name="vat_number" autoComplete="off" value={form.vat_number} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<Phone size={17} />} title="Contact" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Phone *</label>
                                    <input
                                        name="phone"
                                        autoComplete="off"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="off"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={`${inputClass} ${errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Password *</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            autoComplete="new-password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={`${inputClass} pr-10 ${errors.password ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-gray-400 outline-none hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Website</label>
                                    <input name="website" autoComplete="off" value={form.website} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<MapPin size={17} />} title="Address" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Address Line 1</label>
                                    <input name="address_line_1" autoComplete="off" value={form.address_line_1} onChange={handleChange} className={inputClass} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Address Line 2</label>
                                    <input name="address_line_2" autoComplete="off" value={form.address_line_2} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input name="city" autoComplete="off" value={form.city} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Postal Code</label>
                                    <input name="postal_code" autoComplete="off" value={form.postal_code} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Country</label>
                                    <input name="country" autoComplete="off" value={form.country} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <FormSectionHeader icon={<Clock size={17} />} title="Operations" />
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Currency</label>
                                    <CurrencySelect
                                        value={form.currency}
                                        onChange={(code) => setForm((prev) => ({ ...prev, currency: code }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Timezone</label>
                                    <TimezoneSelect
                                        value={form.timezone}
                                        onChange={(tz) => setForm((prev) => ({ ...prev, timezone: tz }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Opening Time</label>
                                    <input type="time" name="opening_time" value={form.opening_time} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Closing Time</label>
                                    <input type="time" name="closing_time" value={form.closing_time} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href="/superadmin/restaurants"
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 no-underline hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Restaurant"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
