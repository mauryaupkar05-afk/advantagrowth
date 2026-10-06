"use client";

import {
  useState,
  useEffect,
  ChangeEvent,
} from "react";
import Link from "next/link";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";
import {
  Pencil,
  Trash2,
  CreditCard,
  Plus,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle,
  Search,
  ReceiptText,
} from "lucide-react";
import api from "@/lib/axios";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import {
  formatPrice,
  formatBilling,
} from "@/lib/subscriptionFormat";

interface Subscription {
  id: number;
  name: string;
  slug: string;
  price: string;
  currency: string;
  interval: string;
  interval_count: number;
  is_active: boolean;
  created_at: string;
}

export default function SubscriptionsPage() {
  const [
    subscriptions,
    setSubscriptions,
  ] = useState<Subscription[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [togglingId, setTogglingId] =
    useState<number | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    api
      .get("/superadmin/subscription")
      .then((response) => {
        setSubscriptions(
          response.data.data
        );
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
          "Failed to load subscriptions. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (
      searchParams.get("added") ===
      "true"
    ) {
      setSuccessMessage(
        "Subscription plan added successfully."
      );

      setTimeout(
        () => setSuccessMessage(""),
        4000
      );

      router.replace(
        "/superadmin/subscriptions"
      );
    } else if (
      searchParams.get("updated") ===
      "true"
    ) {
      setSuccessMessage(
        "Subscription plan updated successfully."
      );

      setTimeout(
        () => setSuccessMessage(""),
        4000
      );

      router.replace(
        "/superadmin/subscriptions"
      );
    }
  }, [searchParams, router]);

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "superAdminSidebarCollapsed"
      );

    if (saved === "true") {
      setSidebarCollapsed(true);
    }

    const handleSidebarToggle = (
      event: CustomEvent
    ) => {
      setSidebarCollapsed(
        event.detail.collapsed
      );
    };

    window.addEventListener(
      "superAdminSidebarToggle",
      handleSidebarToggle as EventListener
    );

    return () =>
      window.removeEventListener(
        "superAdminSidebarToggle",
        handleSidebarToggle as EventListener
      );
  }, []);

  const handleDelete = (id: number) => {
    if (
      !window.confirm(
        "Delete this subscription plan? This cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);

    api
      .delete(
        `/superadmin/subscription/${id}`
      )
      .then(() => {
        setSubscriptions((previous) =>
          previous.filter(
            (subscription) =>
              subscription.id !== id
          )
        );

        setSuccessMessage(
          "Subscription plan deleted successfully."
        );

        setTimeout(
          () => setSuccessMessage(""),
          4000
        );
      })
      .catch((err) => {
        alert(
          err.response?.data?.message ||
          "Failed to delete subscription plan"
        );
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  const handleToggleStatus = (
    id: number
  ) => {
    setTogglingId(id);

    api
      .patch(
        `/superadmin/subscription/${id}/toggle-status`
      )
      .then((response) => {
        setSubscriptions((previous) =>
          previous.map(
            (subscription) =>
              subscription.id === id
                ? {
                  ...subscription,
                  is_active:
                    response.data
                      .is_active,
                }
                : subscription
          )
        );
      })
      .catch((err) => {
        alert(
          err.response?.data?.message ||
          "Failed to update subscription status"
        );
      })
      .finally(() => {
        setTogglingId(null);
      });
  };

  const filteredSubscriptions =
    subscriptions.filter(
      (subscription) => {
        const query = searchQuery
          .trim()
          .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          subscription.name
            .toLowerCase()
            .includes(query) ||
          subscription.slug
            .toLowerCase()
            .includes(query)
        );
      }
    );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSubscriptions.length /
      itemsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedSubscriptions =
    filteredSubscriptions.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage
    );

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(
      Number(event.target.value)
    );

    setCurrentPage(1);
  };

  const getPageNumbers = (): (
    | number
    | "..."
  )[] => {
    const pages: (number | "...")[] =
      [];

    const delta = 1;

    pages.push(1);

    if (safePage - delta > 2) {
      pages.push("...");
    }

    for (
      let page = Math.max(
        2,
        safePage - delta
      );
      page <=
      Math.min(
        totalPages - 1,
        safePage + delta
      );
      page++
    ) {
      pages.push(page);
    }

    if (
      safePage + delta <
      totalPages - 1
    ) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="superadmin-layout">
      <SuperAdminSidebar />

      <main
        className={`superadmin-main-content ${sidebarCollapsed
            ? "sidebar-collapsed-main"
            : "sidebar-expanded-main"
          }`}
      >
        <div
          className="w-full space-y-6 pt-12 lg:pt-0"
          style={{
            fontFamily:
              "'Inter', sans-serif",
          }}
        >
          {loading ? (
            <div className="flex min-h-[calc(100vh-42px)] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

              <p className="text-sm text-gray-500">
                Loading subscriptions...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[calc(100vh-42px)] items-center justify-center">
              <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle
                    size={26}
                    className="text-red-500"
                  />
                </div>

                <h2 className="mb-1.5 text-base font-semibold text-gray-900">
                  Couldn&apos;t load
                  subscriptions
                </h2>

                <p className="mb-6 text-sm text-gray-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
                >
                  <RefreshCw size={17} />
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-start gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div className="pl-px">
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Subscriptions
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    {subscriptions.length}{" "}
                    total
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/superadmin/subscription-payments"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 no-underline shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <ReceiptText size={16} />
                    View Payments
                  </Link>

                  <Link
                    href="/superadmin/subscriptions/add"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-violet-700"
                  >
                    <Plus size={16} />
                    Add Subscription
                  </Link>
                </div>
              </div>

              {successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {successMessage}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <select
                      value={itemsPerPage}
                      onChange={
                        handleItemsPerPageChange
                      }
                      className="box-border rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value={5}>
                        5
                      </option>
                      <option value={10}>
                        10
                      </option>
                      <option value={25}>
                        25
                      </option>
                      <option value={50}>
                        50
                      </option>
                    </select>
                    entries per page
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Search

                    <div className="relative">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={
                          handleSearchChange
                        }
                        autoComplete="off"
                        placeholder="Name, slug..."
                        className="box-border w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm font-normal text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:w-60"
                      />
                    </div>
                  </label>
                </div>

                <div className="scrollbar-hide overflow-x-auto px-2 py-2 sm:px-4">
                  <table className="min-w-[640px] text-base lg:w-full lg:min-w-0 lg:table-fixed">
                    <thead>
                      <tr className="divide-x divide-gray-200 border-b-2 border-gray-200 bg-gray-50">
                        <th className="w-[30%] px-3 py-3.5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                          Name
                        </th>

                        <th className="w-[15%] px-3 py-3.5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                          Price
                        </th>

                        <th className="w-[20%] px-3 py-3.5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                          Billing
                        </th>

                        <th className="w-[15%] px-3 py-3.5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>

                        <th className="w-[20%] px-3 py-3.5 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredSubscriptions.length ===
                        0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-14 text-center text-sm text-gray-500"
                            >
                              {searchQuery
                                ? "No matching subscriptions found."
                                : "No subscription plans found."}
                            </td>
                          </tr>
                        )}

                      {paginatedSubscriptions.map(
                        (subscription) => (
                          <tr
                            key={
                              subscription.id
                            }
                            className="divide-x divide-gray-100 transition-colors hover:bg-gray-50/80"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                  <CreditCard
                                    size={17}
                                  />
                                </span>

                                <div className="min-w-0">
                                  <p className="m-0 truncate font-normal text-gray-700">
                                    {
                                      subscription.name
                                    }
                                  </p>

                                  <p className="m-0 truncate font-mono text-sm text-gray-400">
                                    {
                                      subscription.slug
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="truncate px-3 py-2.5 font-normal text-gray-700">
                              {formatPrice(
                                subscription.price,
                                subscription.currency
                              )}
                            </td>

                            <td className="truncate px-3 py-2.5 font-normal text-gray-700">
                              {formatBilling(
                                subscription.interval,
                                subscription.interval_count
                              )}
                            </td>

                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${subscription.is_active
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                  }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${subscription.is_active
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                    }`}
                                />

                                {subscription.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-2 py-2.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/superadmin/subscriptions/${subscription.id}/edit`}
                                  aria-label="Edit subscription"
                                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 hover:shadow"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleStatus(
                                      subscription.id
                                    )
                                  }
                                  disabled={
                                    togglingId ===
                                    subscription.id
                                  }
                                  aria-label={
                                    subscription.is_active
                                      ? "Deactivate subscription"
                                      : "Activate subscription"
                                  }
                                  title={
                                    subscription.is_active
                                      ? "Deactivate subscription"
                                      : "Activate subscription"
                                  }
                                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {subscription.is_active ? (
                                    <Ban
                                      size={16}
                                    />
                                  ) : (
                                    <CheckCircle
                                      size={16}
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      subscription.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    subscription.id
                                  }
                                  aria-label="Delete subscription"
                                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    {(safePage - 1) *
                      itemsPerPage +
                      1}{" "}
                    to{" "}
                    {Math.min(
                      safePage *
                      itemsPerPage,
                      filteredSubscriptions.length
                    )}{" "}
                    of{" "}
                    {
                      filteredSubscriptions.length
                    }{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={
                        safePage === 1
                      }
                      onClick={() =>
                        setCurrentPage(1)
                      }
                      aria-label="First page"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      «
                    </button>

                    <button
                      type="button"
                      disabled={
                        safePage === 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            page - 1
                        )
                      }
                      aria-label="Previous page"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ‹
                    </button>

                    {getPageNumbers().map(
                      (
                        page,
                        index
                      ) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-1.5 text-sm text-gray-400"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            aria-label={`Page ${page}`}
                            aria-current={
                              page ===
                                safePage
                                ? "page"
                                : undefined
                            }
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page ===
                                safePage
                                ? "bg-violet-600 text-white shadow-sm"
                                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                          >
                            {page}
                          </button>
                        )
                    )}

                    <button
                      type="button"
                      disabled={
                        safePage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            page + 1
                        )
                      }
                      aria-label="Next page"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ›
                    </button>

                    <button
                      type="button"
                      disabled={
                        safePage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          totalPages
                        )
                      }
                      aria-label="Last page"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}