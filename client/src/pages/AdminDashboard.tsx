import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../services/api";

interface CreditRequest {
  _id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reference: string;
  description?: string;
  createdAt: string;
  userId:
    | {
        _id: string;
        name: string;
        phone: string;
        balance: number;
      }
    | string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<{
        requests: CreditRequest[];
      }>("/admin/credit-requests");

      setRequests(response.data.requests);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function approveRequest(id: string) {
    try {
      setProcessingId(id);
      setError("");

      await api.post(`/admin/credit-requests/${id}/approve`);

      await loadRequests();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectRequest(id: string) {
    try {
      setProcessingId(id);
      setError("");

      await api.post(`/admin/credit-requests/${id}/reject`);

      await loadRequests();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("bd_best_betting_token");
    localStorage.removeItem("bd_best_betting_user");

    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={22}
                className="text-cyan-400"
              />

              <h1 className="text-lg font-black">
                BD BEST{" "}
                <span className="text-cyan-400">
                  BETTING WEB
                </span>
              </h1>
            </div>

            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">
              Administration
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">
              Admin Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Review and manage pending virtual credit requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Pending Requests
              </span>

              <Clock3
                size={19}
                className="text-amber-400"
              />
            </div>

            <div className="text-3xl font-black">
              {requests.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Total Requested
              </span>

              <WalletCards
                size={19}
                className="text-cyan-400"
              />
            </div>

            <div className="text-3xl font-black">
              {requests
                .reduce(
                  (total, request) =>
                    total + request.amount,
                  0
                )
                .toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Status
              </span>

              <ShieldCheck
                size={19}
                className="text-emerald-400"
              />
            </div>

            <div className="text-lg font-bold text-emerald-400">
              System Online
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#0d1119] shadow-2xl">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <h3 className="text-lg font-bold">
              Pending Credit Requests
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Review each request before approving virtual
              credits.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Loading requests...
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <CheckCircle2
                size={40}
                className="mx-auto mb-4 text-emerald-400"
              />

              <h4 className="font-bold text-white">
                No pending requests
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                New credit requests will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {requests.map((request) => {
                const user =
                  typeof request.userId === "object"
                    ? request.userId
                    : null;

                const processing =
                  processingId === request._id;

                return (
                  <div
                    key={request._id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:flex-1">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                            <UserRound size={14} />
                            Player
                          </div>

                          <div className="font-bold text-white">
                            {user?.name || "Unknown User"}
                          </div>

                          <div className="mt-1 text-xs text-gray-600">
                            {user?.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-xs text-gray-500">
                            Amount
                          </div>

                          <div className="text-xl font-black text-cyan-400">
                            {request.amount.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-xs text-gray-500">
                            Reference
                          </div>

                          <div className="break-all font-mono text-sm font-semibold text-gray-300">
                            {request.reference}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-xs text-gray-500">
                            Submitted
                          </div>

                          <div className="text-sm text-gray-300">
                            {new Date(
                              request.createdAt
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            approveRequest(request._id)
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-[#03100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          <CheckCircle2 size={17} />
                          {processing
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            rejectRequest(request._id)
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          <XCircle size={17} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}