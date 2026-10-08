import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../../services/api";

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reference: string;
  description?: string;
  createdAt: string;
  userId?: {
    _id?: string;
    name?: string;
    phone?: string;
  };
}

function formatMoney(value: number) {
  return `৳${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Withdrawals() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWithdrawals = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          "/admin/withdrawal-requests"
        );

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.requests)
          ? data.requests
          : Array.isArray(data?.withdrawals)
          ? data.withdrawals
          : [];

        setRequests(list);
      } catch (err) {
        console.error("Admin withdrawals error:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  const handleApprove = async (id: string) => {
    if (processingId) return;

    const confirmed = window.confirm(
      "Approve this withdrawal request?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);
      setError("");
      setSuccess("");

      await api.post(
        `/admin/withdrawal-requests/${id}/approve`
      );

      setRequests((current) =>
        current.map((request) =>
          request._id === id
            ? {
                ...request,
                status: "APPROVED",
              }
            : request
        )
      );

      setSuccess(
        "Withdrawal request approved successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Approve withdrawal error:", err);
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (processingId) return;

    const confirmed = window.confirm(
      "Reject this withdrawal request?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);
      setError("");
      setSuccess("");

      await api.post(
        `/admin/withdrawal-requests/${id}/reject`
      );

      setRequests((current) =>
        current.map((request) =>
          request._id === id
            ? {
                ...request,
                status: "REJECTED",
              }
            : request
        )
      );

      setSuccess("Withdrawal request rejected.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Reject withdrawal error:", err);
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((request) => {
      return (
        request.userId?.name?.toLowerCase().includes(query) ||
        request.userId?.phone?.toLowerCase().includes(query) ||
        request.reference?.toLowerCase().includes(query) ||
        String(request.amount).includes(query)
      );
    });
  }, [requests, search]);

  const pendingCount = requests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "APPROVED"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "REJECTED"
  ).length;

  const pendingAmount = requests
    .filter((request) => request.status === "PENDING")
    .reduce(
      (sum, request) => sum + Number(request.amount || 0),
      0
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading withdrawals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowUpCircle className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-6 w-6 text-red-400" />

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Withdrawals
                </h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Review player withdrawal requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadWithdrawals(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-400">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Pending Amount
                </p>

                <p className="mt-2 text-xl font-bold text-white">
                  {formatMoney(pendingAmount)}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {approvedCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Rejected
                </p>

                <p className="mt-2 text-2xl font-bold text-red-400">
                  {rejectedCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1828] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, reference or amount..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-red-500/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1828]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-white">
                Withdrawal Requests
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredRequests.length} request
                {filteredRequests.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
                <ArrowUpCircle className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-300">
                No withdrawal requests found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                New requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">
                      Client
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Reference
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => {
                    const processing =
                      processingId === request._id;

                    return (
                      <tr
                        key={request._id}
                        className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                              <UserRound className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="font-medium text-slate-200">
                                {request.userId?.name ||
                                  "Unknown"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {request.userId?.phone ||
                                  "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-red-400">
                            {formatMoney(request.amount)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm text-slate-300">
                              {request.reference || "-"}
                            </p>

                            {request.description && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-600">
                                {request.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(request.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              request.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : request.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {request.status === "APPROVED" && (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}

                            {request.status === "PENDING" && (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}

                            {request.status === "REJECTED" && (
                              <XCircle className="h-3.5 w-3.5" />
                            )}

                            {request.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {request.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleApprove(
                                    request._id
                                  )
                                }
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processing ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}

                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleReject(
                                    request._id
                                  )
                                }
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <span className="text-xs text-slate-600">
                                Completed
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}