import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Filter,
  Gamepad2,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../../services/api";

type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "BET"
  | "WIN";

type TransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

interface TransactionItem {
  _id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
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

function getTypeIcon(type: TransactionType) {
  switch (type) {
    case "DEPOSIT":
      return ArrowDownCircle;

    case "WITHDRAWAL":
      return ArrowUpCircle;

    case "BET":
      return Gamepad2;

    case "WIN":
      return Trophy;

    default:
      return Filter;
  }
}

function getTypeStyle(type: TransactionType) {
  switch (type) {
    case "DEPOSIT":
      return "bg-emerald-500/10 text-emerald-400";

    case "WITHDRAWAL":
      return "bg-red-500/10 text-red-400";

    case "BET":
      return "bg-purple-500/10 text-purple-400";

    case "WIN":
      return "bg-cyan-500/10 text-cyan-400";

    default:
      return "bg-white/5 text-slate-300";
  }
}

export default function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<
    TransactionItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | TransactionType
  >("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | TransactionStatus
  >("ALL");

  const [error, setError] = useState("");

  const [editingTransaction, setEditingTransaction] =
    useState<TransactionItem | null>(null);

  const [editType, setEditType] =
    useState<TransactionType>("BET");

  const [editAmount, setEditAmount] = useState("");

  const [editStatus, setEditStatus] =
    useState<TransactionStatus>("APPROVED");

  const [editReference, setEditReference] = useState("");

  const [editDescription, setEditDescription] =
    useState("");

  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const loadTransactions = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/admin/transactions", {
          params: {
            limit: 200,
          },
        });

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        setTransactions(list);
      } catch (err) {
        console.error("Admin transactions error:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.userId?.name
          ?.toLowerCase()
          .includes(query) ||
        transaction.userId?.phone
          ?.toLowerCase()
          .includes(query) ||
        transaction.reference
          ?.toLowerCase()
          .includes(query) ||
        transaction.description
          ?.toLowerCase()
          .includes(query) ||
        String(transaction.amount).includes(query);

      const matchesType =
        typeFilter === "ALL" ||
        transaction.type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        transaction.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    statusFilter,
  ]);

  const totalTransactions = transactions.length;

  const totalDeposits = transactions
    .filter(
      (transaction) =>
        transaction.type === "DEPOSIT" &&
        transaction.status === "APPROVED"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

  const totalWithdrawals = transactions
    .filter(
      (transaction) =>
        transaction.type === "WITHDRAWAL" &&
        transaction.status === "APPROVED"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

  const totalBets = transactions
    .filter(
      (transaction) => transaction.type === "BET"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

  const totalWins = transactions
    .filter(
      (transaction) => transaction.type === "WIN"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

  function openEdit(transaction: TransactionItem) {
    setEditingTransaction(transaction);

    setEditType(transaction.type);
    setEditAmount(String(transaction.amount ?? ""));
    setEditStatus(transaction.status);
    setEditReference(transaction.reference || "");
    setEditDescription(transaction.description || "");
  }

  function closeEdit() {
    if (savingEdit) return;

    setEditingTransaction(null);
    setEditAmount("");
    setEditReference("");
    setEditDescription("");
  }

  async function handleSaveEdit() {
    if (!editingTransaction) return;

    const amount = Number(editAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      const response = await api.put(
        `/admin/transactions/${editingTransaction._id}`,
        {
          type: editType,
          amount,
          status: editStatus,
          reference: editReference.trim(),
          description: editDescription.trim(),
        }
      );

      const updatedTransaction =
        response.data?.transaction ||
        response.data;

      if (
        updatedTransaction &&
        updatedTransaction._id
      ) {
        setTransactions((current) =>
          current.map((transaction) =>
            transaction._id === updatedTransaction._id
              ? updatedTransaction
              : transaction
          )
        );
      } else {
        await loadTransactions(true);
      }

      closeEdit();
    } catch (err) {
      console.error("Update transaction error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(transaction: TransactionItem) {
    const clientName =
      transaction.userId?.name || "this client";

    const confirmed = window.confirm(
      `Remove this transaction from ${clientName}?\n\nAmount: ${formatMoney(
        transaction.amount
      )}\nType: ${transaction.type}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(transaction._id);
      setError("");

      await api.delete(
        `/admin/transactions/${transaction._id}`
      );

      setTransactions((current) =>
        current.filter(
          (item) => item._id !== transaction._id
        )
      );
    } catch (err) {
      console.error("Delete transaction error:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading transactions...</span>
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
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Filter className="h-6 w-6 text-cyan-400" />

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Transactions
                </h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Complete virtual-credit transaction history.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadTransactions(true)}
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

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-300 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4">
            <p className="text-xs text-slate-500">
              Transactions
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {totalTransactions}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4">
            <p className="text-xs text-slate-500">
              Approved Deposits
            </p>

            <p className="mt-2 text-xl font-bold text-emerald-400">
              {formatMoney(totalDeposits)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4">
            <p className="text-xs text-slate-500">
              Approved Withdrawals
            </p>

            <p className="mt-2 text-xl font-bold text-red-400">
              {formatMoney(totalWithdrawals)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4">
            <p className="text-xs text-slate-500">
              Total Bets
            </p>

            <p className="mt-2 text-xl font-bold text-purple-400">
              {formatMoney(totalBets)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-4">
            <p className="text-xs text-slate-500">
              Total Wins
            </p>

            <p className="mt-2 text-xl font-bold text-cyan-400">
              {formatMoney(totalWins)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1828] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search client, phone, reference or amount..."
                className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-500/40"
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | "ALL"
                    | TransactionType
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-slate-300 outline-none focus:border-cyan-500/40"
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">
                Withdrawal
              </option>
              <option value="BET">Bet</option>
              <option value="WIN">Win</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "ALL"
                    | TransactionStatus
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-slate-300 outline-none focus:border-cyan-500/40"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1828]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-white">
                Transaction History
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing {filteredTransactions.length} of{" "}
                {transactions.length} transactions
              </p>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
                <Filter className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-300">
                No transactions found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">
                      Client
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Type
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Reference
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction) => {
                      const Icon = getTypeIcon(
                        transaction.type
                      );

                      const isPositive =
                        transaction.type === "DEPOSIT" ||
                        transaction.type === "WIN";

                      const isDeleting =
                        deletingId === transaction._id;

                      return (
                        <tr
                          key={transaction._id}
                          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                        >
                          {/* Client */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="font-medium text-slate-200">
                                  {transaction.userId
                                    ?.name ||
                                    "Unknown"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {transaction.userId
                                    ?.phone || "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(
                                transaction.type
                              )}`}
                            >
                              <Icon className="h-3.5 w-3.5" />

                              {transaction.type}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4">
                            <span
                              className={`font-semibold ${
                                isPositive
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {isPositive ? "+" : "-"}
                              {formatMoney(
                                transaction.amount
                              )}
                            </span>
                          </td>

                          {/* Reference */}
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm text-slate-300">
                                {transaction.reference ||
                                  "-"}
                              </p>

                              {transaction.description && (
                                <p className="mt-1 max-w-[230px] truncate text-xs text-slate-600">
                                  {
                                    transaction.description
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                transaction.status ===
                                "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : transaction.status ===
                                    "PENDING"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {transaction.status ===
                                "APPROVED" && (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}

                              {transaction.status ===
                                "PENDING" && (
                                <Clock3 className="h-3.5 w-3.5" />
                              )}

                              {transaction.status ===
                                "REJECTED" && (
                                <XCircle className="h-3.5 w-3.5" />
                              )}

                              {transaction.status}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(
                              transaction.createdAt
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(transaction)
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-xs font-medium text-cyan-400 transition hover:border-cyan-500/40 hover:bg-cyan-500/15 hover:text-cyan-300"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(
                                    transaction
                                  )
                                }
                                disabled={isDeleting}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2
                                  className={`h-3.5 w-3.5 ${
                                    isDeleting
                                      ? "animate-pulse"
                                      : ""
                                  }`}
                                />

                                {isDeleting
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0c1828] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Transaction
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update transaction record details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 px-5 py-5">
              {/* Client */}
              <div className="rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
                <p className="text-xs text-slate-500">
                  Client
                </p>

                <p className="mt-1 text-sm font-medium text-slate-200">
                  {editingTransaction.userId?.name ||
                    "Unknown"}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingTransaction.userId?.phone ||
                    "-"}
                </p>
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Type
                  </label>

                  <select
                    value={editType}
                    onChange={(event) =>
                      setEditType(
                        event.target.value as TransactionType
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-white outline-none focus:border-cyan-500/40"
                  >
                    <option value="DEPOSIT">
                      Deposit
                    </option>

                    <option value="WITHDRAWAL">
                      Withdrawal
                    </option>

                    <option value="BET">Bet</option>

                    <option value="WIN">Win</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(
                        event.target.value as TransactionStatus
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-white outline-none focus:border-cyan-500/40"
                  >
                    <option value="PENDING">
                      Pending
                    </option>

                    <option value="APPROVED">
                      Approved
                    </option>

                    <option value="REJECTED">
                      Rejected
                    </option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(event) =>
                    setEditAmount(event.target.value)
                  }
                  placeholder="Enter amount"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Reference
                </label>

                <input
                  type="text"
                  value={editReference}
                  onChange={(event) =>
                    setEditReference(event.target.value)
                  }
                  placeholder="Transaction reference"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(event.target.value)
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#081421] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#06111d] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {savingEdit
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}