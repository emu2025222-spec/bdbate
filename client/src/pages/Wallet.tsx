import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  RefreshCw,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";

import {
  createDepositRequest,
  createWithdrawRequest,
  getBalance,
  getErrorMessage,
  getTransactions,
} from "../services/api";
import type { Transaction } from "../types";

type Tab = "deposit" | "withdraw";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [depositAmount, setDepositAmount] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("deposit");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const [balanceData, transactionData] = await Promise.all([
        getBalance(),
        getTransactions(),
      ]);

      setBalance(balanceData.balance);
      setTransactions(transactionData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const totalDeposits = useMemo(
    () =>
      transactions
        .filter(
          (item) =>
            item.type === "DEPOSIT" && item.status === "APPROVED"
        )
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const totalWithdrawals = useMemo(
    () =>
      transactions
        .filter(
          (item) =>
            item.type === "WITHDRAWAL" &&
            item.status === "APPROVED"
        )
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const pendingRequests = useMemo(
    () =>
      transactions.filter(
        (item) =>
          (item.type === "DEPOSIT" ||
            item.type === "WITHDRAWAL") &&
          item.status === "PENDING"
      ).length,
    [transactions]
  );

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const transactionLabel = (transaction: Transaction) => {
    switch (transaction.type) {
      case "DEPOSIT":
        return "Deposit Request";

      case "WITHDRAWAL":
        return "Withdrawal Request";

      case "BET":
        return "Game Bet";

      case "WIN":
        return "Game Win";

      default:
        return "Wallet Activity";
    }
  };

  const handleDeposit = async () => {
    setError("");
    setSuccess("");

    const amount = Number(depositAmount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!paymentNumber.trim()) {
      setError("Please enter the payment number.");
      return;
    }

    if (!senderNumber.trim()) {
      setError("Please enter the sender mobile number.");
      return;
    }

    if (!transactionId.trim()) {
      setError("Please enter the transaction ID.");
      return;
    }

    const reference = [
      `Payment: ${paymentNumber.trim()}`,
      `Sender: ${senderNumber.trim()}`,
      `Transaction: ${transactionId.trim()}`,
    ].join(" | ");

    try {
      setSubmitting(true);

      await createDepositRequest(amount, reference);

      setDepositAmount("");
      setPaymentNumber("");
      setSenderNumber("");
      setTransactionId("");

      setSuccess("Balance request submitted successfully.");

      await loadWallet();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setError("");
    setSuccess("");

    const amount = Number(withdrawAmount);
    const cleanBkashNumber = bkashNumber.replace(/\s+/g, "");

    if (!amount || amount < 100) {
      setError("Minimum withdrawal amount is 100 credits.");
      return;
    }

    if (!/^(01)[3-9]\d{8}$/.test(cleanBkashNumber)) {
      setError("Please enter a valid 11-digit bKash number.");
      return;
    }

    if (amount > balance) {
      setError("Insufficient balance.");
      return;
    }

    try {
      setSubmitting(true);

      await createWithdrawRequest(
        amount,
        cleanBkashNumber
      );

      setWithdrawAmount("");
      setBkashNumber("");

      setSuccess(
        "Withdrawal request submitted successfully."
      );

      await loadWallet();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: Transaction["status"]) => {
    if (status === "APPROVED") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }

    if (status === "REJECTED") {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }

    return <Clock3 className="h-4 w-4 text-amber-400" />;
  };

  const statusText = (status: Transaction["status"]) => {
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    return "Pending";
  };

  const statusClass = (status: Transaction["status"]) => {
    if (status === "APPROVED") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }

    if (status === "REJECTED") {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="flex items-center gap-3 text-slate-300">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading wallet...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <WalletIcon className="h-6 w-6 text-cyan-400" />

              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Wallet
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Manage Your Balance
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your balance, requests and wallet activity from one place.
            </p>
          </div>

          <button
            onClick={loadWallet}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-blue-500/5 p-5 shadow-xl shadow-cyan-950/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Available Balance
              </span>

              <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-400">
                <WalletIcon className="h-5 w-5" />
              </div>
            </div>

            <p className="text-3xl font-bold">
              {formatAmount(balance)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current balance
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Total Deposits
              </span>

              <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">
              {formatAmount(totalDeposits)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Total Withdrawals
              </span>

              <div className="rounded-xl bg-red-400/10 p-2 text-red-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">
              {formatAmount(totalWithdrawals)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Pending Requests
              </span>

              <div className="rounded-xl bg-amber-400/10 p-2 text-amber-400">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">
              {pendingRequests}
            </p>
          </div>
        </div>

        {/* Request Panel */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10">

            {/* Tabs */}
            <div className="mb-6 flex rounded-2xl border border-white/10 bg-black/20 p-1">
              <button
                onClick={() => {
                  setActiveTab("deposit");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "deposit"
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Add Balance
              </button>

              <button
                onClick={() => {
                  setActiveTab("withdraw");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "withdraw"
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Withdrawal
              </button>
            </div>

            {activeTab === "deposit" ? (
              <div>
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-cyan-400" />

                    <h2 className="text-lg font-bold">
                      Add Balance
                    </h2>
                  </div>

                  <p className="text-sm text-slate-400">
                    Submit a virtual-credit balance request with the required reference details.
                  </p>
                </div>

                <div className="space-y-4">

                  {/* Deposit Amount */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Amount
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(e.target.value)
                      }
                      placeholder="Enter amount"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* Payment Number */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Payment Number
                    </label>

                    <input
                      type="text"
                      value={paymentNumber}
                      onChange={(e) =>
                        setPaymentNumber(e.target.value)
                      }
                      placeholder="01408666304"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />

                    <p className="mt-1.5 text-xs text-slate-500">
                      Send money to this bKash number: 0140866304.
                    </p>
                  </div>

                  {/* Sender Number */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Sender Mobile Number
                    </label>

                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) =>
                        setSenderNumber(e.target.value)
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Transaction ID
                    </label>

                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) =>
                        setTransactionId(e.target.value)
                      }
                      placeholder="Enter transaction ID"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* Rules */}
                  <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />

                      <h3 className="text-sm font-semibold text-white">
                        Important Rules
                      </h3>
                    </div>

                    <ul className="space-y-2 text-xs leading-5 text-slate-400">
                      <li>
                        • This platform uses virtual credits for gameplay.
                      </li>

                      <li>
                        • No real-money payment is required for virtual credits.
                      </li>

                      <li>
                        • Enter the correct reference information.
                      </li>

                      <li>
                        • Duplicate or incorrect requests may be rejected.
                      </li>

                      <li>
                        • Credits are added only after admin approval.
                      </li>

                      <li>
                        • Keep your transaction/reference information accurate.
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}

                    Submit Balance Request
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-cyan-400" />

                    <h2 className="text-lg font-bold">
                      Request Withdrawal
                    </h2>
                  </div>

                  <p className="text-sm text-slate-400">
                    Enter your bKash number and the amount you want to withdraw.
                  </p>
                </div>

                <div className="space-y-4">

                  {/* bKash Number */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      bKash Number
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={bkashNumber}
                      onChange={(e) =>
                        setBkashNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />

                    <p className="mt-1.5 text-xs text-slate-500">
                      Enter your 11-digit bKash number.
                    </p>
                  </div>

                  {/* Withdrawal Amount */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Amount
                    </label>

                    <input
                      type="number"
                      min="100"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(e.target.value)
                      }
                      placeholder="Minimum 100"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                    />

                    <p className="mt-1.5 text-xs text-slate-500">
                      Minimum withdrawal: 100 credits.
                    </p>
                  </div>

                  {/* Available Balance */}
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Available Balance
                      </span>

                      <span className="font-semibold text-white">
                        {formatAmount(balance)}
                      </span>
                    </div>
                  </div>

                  {/* Withdrawal Notice */}
                  <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-amber-400" />

                      <h3 className="text-sm font-semibold text-white">
                        Withdrawal Notice
                      </h3>
                    </div>

                    <p className="text-xs leading-5 text-slate-400">
                      Withdrawal requests are processed as virtual-credit
                      account actions and require admin approval.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleWithdraw}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}

                    Submit Withdrawal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <History className="h-5 w-5 text-cyan-400" />

                  <h2 className="text-lg font-bold">
                    Transaction History
                  </h2>
                </div>

                <p className="text-sm text-slate-400">
                  Your latest wallet and gaming activity.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-400">
                {transactions.length} Records
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <History className="mb-4 h-10 w-10 text-slate-600" />

                <h3 className="text-base font-semibold text-slate-300">
                  No Transactions Yet
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Your wallet activity will appear here once you start using
                  the platform.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isDeposit =
                    transaction.type === "DEPOSIT";

                  const isWithdrawal =
                    transaction.type === "WITHDRAWAL";

                  const isBet =
                    transaction.type === "BET";

                  return (
                    <div
                      key={transaction._id}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4 transition hover:border-white/15 hover:bg-white/[0.03]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white/[0.05] p-2.5">
                            {transaction.type === "WIN" ? (
                              <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                            ) : isBet ? (
                              <ArrowUpRight className="h-5 w-5 text-red-400" />
                            ) : isDeposit ? (
                              <ArrowDownLeft className="h-5 w-5 text-cyan-400" />
                            ) : isWithdrawal ? (
                              <ArrowUpRight className="h-5 w-5 text-amber-400" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-amber-400" />
                            )}
                          </div>

                          <div>
                            <h3 className="font-semibold text-white">
                              {transactionLabel(transaction)}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(transaction.createdAt)}
                            </p>

                            {transaction.reference && (
                              <p className="mt-1 break-all text-xs text-slate-500">
                                Ref: {transaction.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-right">
                            <p
                              className={`font-bold ${
                                isBet || isWithdrawal
                                  ? "text-red-300"
                                  : "text-emerald-300"
                              }`}
                            >
                              {isBet || isWithdrawal ? "-" : "+"}
                              {formatAmount(transaction.amount)}
                            </p>

                            <div
                              className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                                transaction.status
                              )}`}
                            >
                              {statusIcon(transaction.status)}
                              {statusText(transaction.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-center text-xs text-slate-500">
          Balance and wallet requests are used for gameplay within this
          platform.
        </div>
      </div>
    </div>
  );
}