import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gamepad2,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../../services/api";

interface DashboardData {
  totalClients: number;
  totalPlayerBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;

  game: {
    status: "RUNNING" | "CRASHED" | "WAITING" | "NONE";
    roundNumber?: number;
    crashPoint?: number;
    startedAt?: string;
    crashedAt?: string;
  };
}

interface TransactionItem {
  _id: string;
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "BET"
    | "WIN";
  amount: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";
  reference: string;
  description?: string;
  createdAt: string;
  userId?: {
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

function getStatusLabel(
  status: DashboardData["game"]["status"]
) {
  switch (status) {
    case "RUNNING":
      return "Running";

    case "CRASHED":
      return "Crashed";

    case "WAITING":
      return "Waiting";

    default:
      return "No Active Round";
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [transactions, setTransactions] =
    useState<TransactionItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          dashboardResponse,
          transactionsResponse,
        ] = await Promise.all([
          api.get("/admin/dashboard"),

          api.get("/admin/transactions", {
            params: {
              limit: 8,
            },
          }),
        ]);

        /*
         * Backend response:
         *
         * {
         *   stats: {
         *     totalClients,
         *     totalPlayerBalance,
         *     pendingDeposits,
         *     pendingWithdrawals,
         *     totalBets,
         *     totalWins,
         *     totalLosses
         *   },
         *
         *   game: {
         *     running,
         *     roundNumber
         *   },
         *
         *   latestTransactions
         * }
         */

        const responseData =
          dashboardResponse.data || {};

        const stats =
          responseData.stats || {};

        const game =
          responseData.game || {};

        let gameStatus:
          | "RUNNING"
          | "CRASHED"
          | "WAITING"
          | "NONE" = "NONE";

        if (game.running) {
          gameStatus = "RUNNING";
        } else if (game.roundNumber) {
          gameStatus = "WAITING";
        }

        setDashboard({
          totalClients: Number(
            stats.totalClients || 0
          ),

          totalPlayerBalance: Number(
            stats.totalPlayerBalance || 0
          ),

          pendingDeposits: Number(
            stats.pendingDeposits || 0
          ),

          pendingWithdrawals: Number(
            stats.pendingWithdrawals || 0
          ),

          totalBets: Number(
            stats.totalBets || 0
          ),

          totalWins: Number(
            stats.totalWins || 0
          ),

          totalLosses: Number(
            stats.totalLosses || 0
          ),

          game: {
            status: gameStatus,

            roundNumber:
              game.roundNumber ??
              undefined,
          },
        });

        const transactionData =
          transactionsResponse.data;

        const transactionList =
          Array.isArray(transactionData)
            ? transactionData
            : Array.isArray(
                transactionData?.transactions
              )
            ? transactionData.transactions
            : [];

        setTransactions(
          transactionList
        );
      } catch (err) {
        console.error(
          "Admin dashboard error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /*
   * Automatically refresh dashboard
   * every 15 seconds.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        void loadDashboard(true);
      }, 15000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [loadDashboard]);

  const statCards = [
    {
      title: "Total Clients",

      value:
        dashboard?.totalClients ?? 0,

      icon: Users,

      iconClass:
        "bg-blue-500/10 text-blue-400",

      path: "/admin/clients",
    },

    {
      title: "Player Balance",

      value: formatMoney(
        dashboard?.totalPlayerBalance ??
          0
      ),

      icon: WalletCards,

      iconClass:
        "bg-emerald-500/10 text-emerald-400",

      path: "/admin/clients",
    },

    {
      title: "Pending Deposits",

      value:
        dashboard?.pendingDeposits ?? 0,

      icon: ArrowDownCircle,

      iconClass:
        "bg-amber-500/10 text-amber-400",

      path: "/admin/deposits",
    },

    {
      title: "Pending Withdrawals",

      value:
        dashboard?.pendingWithdrawals ?? 0,

      icon: ArrowUpCircle,

      iconClass:
        "bg-red-500/10 text-red-400",

      path: "/admin/withdrawals",
    },

    {
      title: "Total Bets",

      value:
        dashboard?.totalBets ?? 0,

      icon: Gamepad2,

      iconClass:
        "bg-purple-500/10 text-purple-400",

      path: "/admin/transactions",
    },

    {
      title: "Total Wins",

      value:
        dashboard?.totalWins ?? 0,

      icon: ShieldCheck,

      iconClass:
        "bg-cyan-500/10 text-cyan-400",

      path: "/admin/transactions",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />

          <span>
            Loading admin dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* =========================
            HEADER
        ========================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Admin Dashboard
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Monitor clients, wallet activity and game status.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* =========================
            REAL DATABASE STATS
        ========================== */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                type="button"
                onClick={() =>
                  navigate(card.path)
                }
                className="group rounded-2xl border border-white/10 bg-[#0c1828] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#101e31]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="text-xs text-slate-500 transition group-hover:text-slate-300">
                    View
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-400">
                    {card.title}
                  </p>

                  <p className="mt-1 truncate text-xl font-bold text-white">
                    {card.value}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* =========================
            MAIN CONTENT
        ========================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

          {/* =========================
              RECENT TRANSACTIONS
          ========================== */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1828]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-semibold text-white">
                  Recent Transactions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest wallet and game activity
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/transactions"
                  )
                }
                className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
              >
                View All
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">
                        User
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Type
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map(
                      (transaction) => {
                        const isPositive =
                          transaction.type ===
                            "DEPOSIT" ||
                          transaction.type ===
                            "WIN";

                        return (
                          <tr
                            key={
                              transaction._id
                            }
                            className="border-b border-white/5 last:border-0"
                          >
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium text-slate-200">
                                  {transaction
                                    .userId
                                    ?.name ||
                                    "Unknown"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {transaction
                                    .userId
                                    ?.phone ||
                                    "-"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                                {
                                  transaction.type
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={
                                  isPositive
                                    ? "font-semibold text-emerald-400"
                                    : "font-semibold text-red-400"
                                }
                              >
                                {isPositive
                                  ? "+"
                                  : "-"}

                                {formatMoney(
                                  transaction.amount
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  transaction.status ===
                                  "APPROVED"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : transaction.status ===
                                      "PENDING"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {
                                  transaction.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500">
                              {formatDate(
                                transaction.createdAt
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =========================
              GAME STATUS
          ========================== */}

          <section className="rounded-2xl border border-white/10 bg-[#0c1828]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-semibold text-white">
                Aviator Game Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current global game round
              </p>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-white/10 bg-[#081421] p-5">

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Current Status
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      dashboard?.game.status ===
                      "RUNNING"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : dashboard?.game
                              .status ===
                          "CRASHED"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        dashboard?.game
                          .status ===
                        "RUNNING"
                          ? "bg-emerald-400"
                          : dashboard?.game
                                .status ===
                            "CRASHED"
                          ? "bg-red-400"
                          : "bg-amber-400"
                      }`}
                    />

                    {getStatusLabel(
                      dashboard?.game
                        .status || "NONE"
                    )}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-slate-500">
                    Round Number
                  </p>

                  <p className="mt-1 text-3xl font-bold text-white">
                    #
                    {dashboard?.game
                      .roundNumber ??
                      "-"}
                  </p>
                </div>

                {dashboard?.game
                  .status ===
                  "RUNNING" && (
                  <div className="mt-5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                    <p className="text-xs text-emerald-400">
                      Game is currently
                      running
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Players can participate
                      in the current global
                      round.
                    </p>
                  </div>
                )}

                {dashboard?.game
                  .status ===
                  "CRASHED" &&
                  dashboard.game
                    .crashPoint && (
                    <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                      <p className="text-xs text-red-400">
                        Last round crashed
                        at
                      </p>

                      <p className="mt-1 text-2xl font-bold text-white">
                        {Number(
                          dashboard.game
                            .crashPoint
                        ).toFixed(2)}
                        x
                      </p>
                    </div>
                  )}
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/game")
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <Gamepad2 className="h-4 w-4" />

                Game Management
              </button>
            </div>
          </section>
        </div>

        {/* =========================
            QUICK ACTIONS
        ========================== */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0c1828] p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-white">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage the main areas of your admin panel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/clients"
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-blue-400/20 hover:bg-blue-400/5"
            >
              <Users className="h-5 w-5 text-blue-400" />

              <p className="mt-3 text-sm font-semibold text-white">
                Clients
              </p>

              <p className="mt-1 text-xs text-slate-500">
                View all players
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/deposits"
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-emerald-400/20 hover:bg-emerald-400/5"
            >
              <ArrowDownCircle className="h-5 w-5 text-emerald-400" />

              <p className="mt-3 text-sm font-semibold text-white">
                Deposits
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review deposit requests
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/withdrawals"
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-red-400/20 hover:bg-red-400/5"
            >
              <ArrowUpCircle className="h-5 w-5 text-red-400" />

              <p className="mt-3 text-sm font-semibold text-white">
                Withdrawals
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review withdrawal requests
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/game"
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-purple-400/20 hover:bg-purple-400/5"
            >
              <Gamepad2 className="h-5 w-5 text-purple-400" />

              <p className="mt-3 text-sm font-semibold text-white">
                Game Control
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Manage game settings
              </p>
            </button>

          </div>
        </section>
      </div>
    </div>
  );
}