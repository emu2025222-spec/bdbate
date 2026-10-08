import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Info,
  Loader2,
  Send,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import {
  createDepositRequest,
  getBalance,
  getErrorMessage,
} from "../services/api";

const PLATFORM_REFERENCE = "BD-BEST-CREDITS";

export default function AddCredits() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadBalance() {
    try {
      const result = await getBalance();
      setBalance(result.balance);
    } catch {
      setError("Unable to load your balance.");
    } finally {
      setLoadingBalance(false);
    }
  }

  useEffect(() => {
    loadBalance();
  }, []);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(
        PLATFORM_REFERENCE
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Unable to copy reference.");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!reference.trim()) {
      setError("Enter your transaction/reference ID.");
      return;
    }

    try {
      setLoading(true);

      await createDepositRequest(
        numericAmount,
        reference.trim()
      );

      setAmount("");
      setReference("");

      setSuccess(
        "Your credit request has been submitted and is waiting for admin approval."
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <Navbar balance={balance} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/wallet"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={17} />
            Wallet
          </Link>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <WalletCards
              size={17}
              className="text-cyan-400"
            />

            <span className="text-sm text-gray-400">
              Balance
            </span>

            <span className="font-bold text-white">
              {loadingBalance
                ? "..."
                : balance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl font-black tracking-tight">
            Add Credits
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Submit a virtual credit request for admin review.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-white/10 bg-[#0d1119] p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <CreditCard size={21} />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Credit Request
                </h2>

                <p className="text-xs text-gray-500">
                  Complete the form below
                </p>
              </div>
            </div>

            {success && (
              <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <div>{success}</div>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="Enter amount"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-gray-600 transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Transaction / Reference ID
                </label>

                <input
                  type="text"
                  value={reference}
                  onChange={(event) =>
                    setReference(event.target.value)
                  }
                  placeholder="Enter transaction ID"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-gray-600 transition focus:border-cyan-400/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 font-black text-[#041016] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    SUBMIT REQUEST
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Info
                  size={18}
                  className="text-cyan-400"
                />

                <h2 className="font-bold">
                  Platform Reference
                </h2>
              </div>

              <p className="mb-3 text-xs leading-5 text-gray-500">
                Use this platform reference when identifying
                your credit request.
              </p>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="font-mono text-sm font-bold text-cyan-300">
                  {PLATFORM_REFERENCE}
                </span>

                <button
                  type="button"
                  onClick={copyReference}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                  title="Copy"
                >
                  {copied ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Copy size={17} />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-5">
              <h2 className="mb-4 font-bold">
                Request Process
              </h2>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-400">
                    1
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Enter amount
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Choose the amount of virtual credits.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-400">
                    2
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Add reference ID
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Provide your transaction/reference ID.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-400">
                    3
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Admin review
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Your request will be reviewed before
                      credits are added.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}