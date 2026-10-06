"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type Payment = {
  id: number;
  provider_order_id: string;
  provider_payment_id: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  restaurant: {
    id: number;
    name: string;
    email: string;
  };
  subscription: {
    id: number;
    name: string;
    slug: string;
  };
  restaurant_subscription: {
    id: number;
    status: string;
    starts_at: string | null;
    expires_at: string | null;
  } | null;
};

type PaymentSummary = {
  status_counts: {
    pending: number;
    paid: number;
    failed: number;
    refunded: number;
  };
  paid_totals_by_currency: {
    currency: string;
    payments_count: number;
    total_amount: string;
  }[];
};

type PaymentApiResponse = {
  success: boolean;
  data: {
    data: Payment[];
    current_page: number;
    last_page: number;
    total: number;
  };
  summary: PaymentSummary;
};

const PER_PAGE = 20;

function formatAmount(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: PaymentStatus): string {
  if (status === "paid") {
    return "bg-green-50 text-green-700";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "refunded") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-red-50 text-red-700";
}

export default function SubscriptionPaymentsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [summary, setSummary] = useState<PaymentSummary>({
    status_counts: { pending: 0, paid: 0, failed: 0, refunded: 0 },
    paid_totals_by_currency: [],
  });

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("superAdminSidebarCollapsed");

    if (saved === "true") {
      setSidebarCollapsed(true);
    }

    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ collapsed: boolean }>;
      setSidebarCollapsed(customEvent.detail.collapsed);
    };

    window.addEventListener("superAdminSidebarToggle", handleSidebarToggle);

    return () => {
      window.removeEventListener(
        "superAdminSidebarToggle",
        handleSidebarToggle
      );
    };
  }, []);

  const loadPayments = useCallback(
    async (requestedPage: number) => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<PaymentApiResponse>(
          "/superadmin/subscription-payments",
          {
            params: {
              page: requestedPage,
              per_page: PER_PAGE,
              status: status || undefined,
            },
          }
        );

        setPayments(response.data.data.data);
        setSummary(response.data.summary);
        setPage(response.data.data.current_page);
        setLastPage(response.data.data.last_page);
        setTotal(response.data.data.total);
      } catch (requestError) {
        console.error("Payment history error:", requestError);
        setError("Unable to load subscription payments.");
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    loadPayments(1);
  }, [loadPayments]);

  const cards = [
    {
      label: "Paid",
      value: summary.status_counts.paid,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Pending",
      value: summary.status_counts.pending,
      icon: Clock,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Failed",
      value: summary.status_counts.failed,
      icon: XCircle,
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Refunded",
      value: summary.status_counts.refunded,
      icon: RotateCcw,
      color: "bg-blue-50 text-blue-700",
    },
  ];

  const rangeStart = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangeEnd = Math.min(page * PER_PAGE, total);

  return (
    <div className="superadmin-layout">
      <SuperAdminSidebar />

      <main
        className={`superadmin-main-content ${sidebarCollapsed ? "sidebar-collapsed-main" : "sidebar-expanded-main"
          }`}
      >
        <div
          className="w-full space-y-6 pt-12 lg:pt-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="mb-6 flex flex-col items-start gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="pl-px">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600">
                Subscription billing
              </p>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Payments
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Razorpay subscription payments received from restaurants.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/superadmin/subscriptions"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 no-underline shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                <ArrowLeft size={16} />
                Back to Subscriptions
              </Link>

              <button
                type="button"
                onClick={() => loadPayments(page)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}
                  >
                    <Icon size={18} />
                  </div>

                  <p className="text-sm text-gray-500">{card.label}</p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          {summary.paid_totals_by_currency.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              {summary.paid_totals_by_currency.map((item) => (
                <div
                  key={item.currency}
                  className="rounded-xl border border-green-200 bg-green-50 px-5 py-3"
                >
                  <p className="text-xs font-semibold uppercase text-green-600">
                    Received in {item.currency}
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-800">
                    {formatAmount(item.total_amount, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Payment History
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  {total} payment record{total === 1 ? "" : "s"}
                </p>
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                <p className="text-sm text-gray-500">Loading payments...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <p className="text-sm text-gray-600">{error}</p>
                <button
                  type="button"
                  onClick={() => loadPayments(page)}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-16 text-center text-sm text-gray-500">
                No payments found.
              </div>
            ) : (
              <div className="scrollbar-hide overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3.5 font-semibold">
                        Restaurant
                      </th>
                      <th className="px-5 py-3.5 font-semibold">Plan</th>
                      <th className="px-5 py-3.5 font-semibold">Amount</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Method</th>
                      <th className="px-5 py-3.5 font-semibold">
                        Payment ID
                      </th>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">
                            {payment.restaurant.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.restaurant.email}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          {payment.subscription.name}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClasses(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 capitalize text-gray-600">
                          {payment.payment_method || "—"}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                          {payment.provider_payment_id ||
                            payment.provider_order_id}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          {formatDate(payment.paid_at || payment.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && payments.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row">
                <p className="text-sm text-gray-500">
                  Showing {rangeStart} to {rangeEnd} of {total} entries
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => loadPayments(page - 1)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-1 text-sm text-gray-500">
                    Page {page} of {lastPage}
                  </span>

                  <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => loadPayments(page + 1)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
