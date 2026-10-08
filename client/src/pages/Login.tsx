import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { getErrorMessage, login } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(phone, password);

      localStorage.setItem(
        "bd_best_betting_token",
        result.token
      );

      localStorage.setItem(
        "bd_best_betting_user",
        JSON.stringify(result.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.03] blur-[100px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:55px_55px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Left Side */}
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-sm font-semibold text-cyan-300">
                <Sparkles size={15} />
                Premium Gaming Platform
              </div>

              <h1 className="text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                Play.
                <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Compete.
                </span>
                <span className="block">Enjoy.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
                Welcome to BD BEST BETTING WEB. Access your
                account, explore the game collection and manage
                your gaming balance from one place.
              </p>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
                  <Zap className="mb-3 text-cyan-400" size={21} />
                  <p className="text-sm font-bold text-white">
                    Fast
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Smooth experience
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
                  <Trophy
                    className="mb-3 text-cyan-400"
                    size={21}
                  />
                  <p className="text-sm font-bold text-white">
                    Games
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Exciting collection
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
                  <ShieldCheck
                    className="mb-3 text-cyan-400"
                    size={21}
                  />
                  <p className="text-sm font-bold text-white">
                    Secure
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Protected account
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Login Card */}
          <section className="mx-auto w-full max-w-md">
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 blur-xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0f18]/95 shadow-2xl backdrop-blur-2xl">
                {/* Top Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

                <div className="p-6 sm:p-8">
                  {/* Brand */}
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/10 shadow-lg shadow-cyan-500/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-xl font-black text-[#031018] shadow-lg shadow-cyan-500/20">
                        BD
                      </div>
                    </div>

                    <h2 className="text-2xl font-black tracking-tight">
                      BD BEST BETTING WEB
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Welcome back. Sign in to continue.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Phone */}
                    <div>
                      <label className="mb-2.5 block text-sm font-semibold text-gray-300">
                        Mobile Number
                      </label>

                      <div className="group relative">
                        <Phone
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition group-focus-within:text-cyan-400"
                        />

                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value)
                          }
                          placeholder="01XXXXXXXXX"
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/25 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-600 hover:border-white/15 focus:border-cyan-400/50 focus:bg-cyan-400/[0.025] focus:ring-4 focus:ring-cyan-400/[0.06]"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="mb-2.5 block text-sm font-semibold text-gray-300">
                        Password
                      </label>

                      <div className="group relative">
                        <LockKeyhole
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition group-focus-within:text-cyan-400"
                        />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Enter your password"
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/25 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-gray-600 hover:border-white/15 focus:border-cyan-400/50 focus:bg-cyan-400/[0.025] focus:ring-4 focus:ring-cyan-400/[0.06]"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) => !value
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative mt-2 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-300 to-cyan-400 font-black text-[#031018] shadow-lg shadow-cyan-500/10 transition-all hover:-translate-y-0.5 hover:from-cyan-200 hover:to-cyan-300 hover:shadow-cyan-400/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                    >
                      <span>
                        {loading
                          ? "Signing in..."
                          : "Sign In"}
                      </span>

                      {!loading && (
                        <ArrowRight
                          size={18}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="my-7 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="text-xs text-gray-600">
                      OR
                    </span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>

                  {/* Register */}
                  <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Don't have an account?
                    </p>

                    <Link
                      to="/register"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
                    >
                      Create Account
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  {/* Bottom Security */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
                    <ShieldCheck size={14} />
                    Your account is protected
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-600">
              © 2026 BD BEST BETTING WEB
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}