import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  ChevronRight,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Trophy,
  WalletCards,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { getBalance, getErrorMessage } from "../services/api";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("bd_best_betting_user");

  let userName = "Player";

  try {
    if (storedUser) {
      const user = JSON.parse(storedUser);
      userName = user?.name || "Player";
    }
  } catch {
    userName = "Player";
  }

  useEffect(() => {
    async function load() {
      try {
        const result = await getBalance();
        setBalance(result.balance);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#050811] text-white">
      <Navbar balance={balance} />

      <main className="page-glow mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#09111d] shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.07] blur-[100px]" />
            <div className="absolute -bottom-40 left-[35%] h-[420px] w-[420px] rounded-full bg-blue-600/[0.06] blur-[110px]" />

            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
          </div>

          <div className="relative grid items-center gap-10 p-6 sm:p-9 lg:grid-cols-[1.3fr_0.7fr] lg:p-12">
            {/* Hero content */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                <span className="status-dot" />
                Platform Online
              </div>

              <h1 className="max-w-3xl text-[42px] font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-[68px]">
                Welcome back,
                <br />
                <span className="text-gradient">{userName}.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Explore your favourite games, manage your
                credits and enjoy a smooth gaming experience
                from one powerful platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/games"
                  className="premium-button cyan-button inline-flex items-center gap-2"
                >
                  <Gamepad2 size={18} />
                  Explore Games
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/wallet"
                  className="premium-button inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] text-white hover:border-white/15 hover:bg-white/[0.07]"
                >
                  <WalletCards size={18} />
                  My Wallet
                </Link>
              </div>

              {/* Mini trust indicators */}
              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={15}
                    className="text-emerald-400"
                  />
                  Protected account
                </div>

                <div className="h-3 w-px bg-white/10" />

                <div className="flex items-center gap-2">
                  <Zap
                    size={14}
                    className="text-cyan-400"
                  />
                  Fast experience
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[32px] bg-cyan-400/[0.025] blur-2xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/25 p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/[0.05] blur-3xl" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        Available Credits
                      </div>

                      <div className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                        {loading ? "••••" : balance.toFixed(2)}
                      </div>

                      <div className="mt-2 text-xs font-medium text-slate-600">
                        Current account balance
                      </div>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.08] text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                      <WalletCards size={22} />
                    </div>
                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck
                        size={14}
                        className="text-emerald-400"
                      />
                      Secure balance
                    </div>

                    <Link
                      to="/wallet"
                      className="text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* =====================================================
            QUICK STATS
        ====================================================== */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="premium-card group p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Games
                </div>

                <div className="mt-2 text-3xl font-black tracking-tight">
                  04
                </div>

                <div className="mt-1 text-xs text-slate-600">
                  Available titles
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/[0.08] text-blue-400 transition group-hover:bg-blue-500/[0.14]">
                <Gamepad2 size={21} />
              </div>
            </div>
          </div>

          <div className="premium-card group p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Experience
                </div>

                <div className="mt-2 text-3xl font-black tracking-tight">
                  Elite
                </div>

                <div className="mt-1 text-xs text-slate-600">
                  Player level
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/[0.08] text-purple-400 transition group-hover:bg-purple-500/[0.14]">
                <Award size={21} />
              </div>
            </div>
          </div>

          <div className="premium-card group p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Status
                </div>

                <div className="mt-2 text-3xl font-black tracking-tight text-emerald-400">
                  Active
                </div>

                <div className="mt-1 text-xs text-slate-600">
                  Account status
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/[0.08] text-emerald-400 transition group-hover:bg-emerald-500/[0.14]">
                <Zap size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FEATURED GAME
        ====================================================== */}
        <section className="mt-11">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                <Sparkles size={14} />
                Featured
              </div>

              <h2 className="section-title">
                Popular Game
              </h2>

              <p className="section-subtitle">
                Jump straight into the action.
              </p>
            </div>

            <Link
              to="/games"
              className="hidden items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-cyan-300 sm:flex"
            >
              View all
              <ChevronRight size={17} />
            </Link>
          </div>

          <Link
            to="/games/aviator"
            className="group block"
          >
            <div className="game-panel relative overflow-hidden">
              <div className="relative min-h-[330px] p-7 sm:min-h-[370px] sm:p-10">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-[-8%] top-[-30%] h-[430px] w-[430px] rounded-full bg-cyan-400/[0.08] blur-[90px]" />

                  <div className="absolute bottom-[-40%] right-[20%] h-[300px] w-[300px] rounded-full bg-blue-500/[0.05] blur-[90px]" />
                </div>

                <div className="relative z-10 max-w-xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/[0.06] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                    <Zap size={13} />
                    Featured Game
                  </div>

                  <h3 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">
                    Aviator
                  </h3>

                  <p className="mt-4 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                    A fast-paced virtual multiplier experience.
                    Watch the multiplier rise and make your move
                    before the round ends.
                  </p>

                  <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.05] px-5 py-3 text-sm font-black transition-all duration-300 group-hover:border-cyan-400/20 group-hover:bg-cyan-400 group-hover:text-[#031014]">
                    Play Now
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </div>

                {/* Trophy visual */}
                <div className="absolute bottom-8 right-8 hidden sm:block">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-[32px] border border-cyan-400/10 bg-cyan-400/[0.035] shadow-[0_0_70px_rgba(34,211,238,0.08)] transition duration-500 group-hover:scale-105">
                    <div className="absolute inset-3 rounded-[24px] border border-white/[0.04]" />

                    <Trophy
                      size={48}
                      className="relative text-cyan-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* =====================================================
            WHY PLATFORM
        ====================================================== */}
        <section className="mt-11 pb-8">
          <div className="mb-5">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
              Platform
            </div>

            <h2 className="section-title">
              Built for a better experience
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="premium-card group p-6 transition hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/[0.08] text-cyan-400">
                <ShieldCheck size={23} />
              </div>

              <h3 className="mt-5 font-black">
                Secure Experience
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your account and platform activity stay
                protected.
              </p>
            </div>

            <div className="premium-card group p-6 transition hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/[0.08] text-yellow-400">
                <Zap size={23} />
              </div>

              <h3 className="mt-5 font-black">
                Fast Gameplay
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Clean interface designed for quick and
                responsive gameplay.
              </p>
            </div>

            <div className="premium-card group p-6 transition hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-400/[0.08] text-purple-400">
                <Trophy size={23} />
              </div>

              <h3 className="mt-5 font-black">
                Built for Players
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Games, wallet and account controls in one
                polished platform.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}