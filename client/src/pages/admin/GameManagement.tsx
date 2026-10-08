import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Gamepad2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../../services/api";

interface GameStatus {
  running?: boolean;
  enabled?: boolean;
  maintenance?: boolean;
  status?: string;
  round?: {
    _id?: string;
    roundNumber?: number;
    status?: string;
    startedAt?: string;
    crashedAt?: string;
  };
  multiplier?: number;
  message?: string;
  settings?: {
    enabled?: boolean;
    maintenance?: boolean;
    minBet?: number;
    maxBet?: number;
    waitingTime?: number;
    maxCrashMultiplier?: number;
  };
}

interface GameSettings {
  enabled: boolean;
  maintenance: boolean;
  minBet: number;
  maxBet: number;
  waitingTime: number;
  maxCrashMultiplier: number;
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

export default function GameManagement() {
  const navigate = useNavigate();

  const [status, setStatus] =
    useState<GameStatus | null>(null);

  const [settings, setSettings] =
    useState<GameSettings>({
      enabled: true,
      maintenance: false,
      minBet: 10,
      maxBet: 10000,
      waitingTime: 10,
      maxCrashMultiplier: 20,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadGameStatus = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          "/admin/game-status"
        );

        const data = response.data;

        setStatus(data);

        setSettings((previous) => ({
          ...previous,

          ...(typeof data?.enabled === "boolean"
            ? {
                enabled: data.enabled,
              }
            : {}),

          ...(typeof data?.maintenance ===
          "boolean"
            ? {
                maintenance:
                  data.maintenance,
              }
            : {}),

          ...(typeof data?.settings?.minBet ===
          "number"
            ? {
                minBet:
                  data.settings.minBet,
              }
            : {}),

          ...(typeof data?.settings?.maxBet ===
          "number"
            ? {
                maxBet:
                  data.settings.maxBet,
              }
            : {}),

          ...(typeof data?.settings
            ?.waitingTime === "number"
            ? {
                waitingTime:
                  data.settings.waitingTime,
              }
            : {}),

          ...(typeof data?.settings
            ?.maxCrashMultiplier ===
          "number"
            ? {
                maxCrashMultiplier:
                  data.settings
                    .maxCrashMultiplier,
              }
            : {}),
        }));
      } catch (err) {
        console.error(
          "Admin game status error:",
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
    void loadGameStatus();

    const interval =
      window.setInterval(() => {
        void loadGameStatus(true);
      }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadGameStatus]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.put(
        "/admin/game-settings",
        {
          enabled:
            settings.enabled,

          maintenance:
            settings.maintenance,

          minBet:
            settings.minBet,

          maxBet:
            settings.maxBet,

          waitingTime:
            settings.waitingTime,

          maxCrashMultiplier:
            settings.maxCrashMultiplier,
        }
      );

      setMessage(
        "Game settings updated successfully."
      );

      await loadGameStatus();
    } catch (err) {
      console.error(
        "Game settings update error:",
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleGame = async () => {
    const nextEnabled =
      !settings.enabled;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.put(
        "/admin/game-settings",
        {
          ...settings,
          enabled:
            nextEnabled,
        }
      );

      setSettings(
        (previous) => ({
          ...previous,
          enabled:
            nextEnabled,
        })
      );

      setMessage(
        nextEnabled
          ? "Aviator has been enabled."
          : "Aviator has been disabled."
      );

      await loadGameStatus();
    } catch (err) {
      console.error(
        "Game toggle error:",
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance =
    async () => {
      const nextMaintenance =
        !settings.maintenance;

      try {
        setSaving(true);
        setError("");
        setMessage("");

        await api.put(
          "/admin/game-settings",
          {
            ...settings,

            maintenance:
              nextMaintenance,
          }
        );

        setSettings(
          (previous) => ({
            ...previous,
            maintenance:
              nextMaintenance,
          })
        );

        setMessage(
          nextMaintenance
            ? "Maintenance mode enabled."
            : "Maintenance mode disabled."
        );

        await loadGameStatus();
      } catch (err) {
        console.error(
          "Maintenance toggle error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setSaving(false);
      }
    };

  const roundRunning =
    status?.round?.status ===
      "RUNNING" ||
    status?.status ===
      "RUNNING" ||
    status?.running === true;

  const currentRound =
    status?.round?.roundNumber ??
    null;

  const currentMultiplier =
    typeof status?.multiplier ===
    "number"
      ? status.multiplier
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>
            Loading game management...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-cyan-400" />

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Game Management
                </h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Manage Aviator operational
                settings and monitor the live
                game.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadGameStatus(true)
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

        {/* Alerts */}
        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Live Status */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Activity className="h-5 w-5" />
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  roundRunning
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    roundRunning
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />

                {roundRunning
                  ? "LIVE"
                  : "WAITING"}
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Game Status
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {roundRunning
                ? "Round Running"
                : "Waiting"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Zap className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Current Round
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {currentRound
                ? `#${currentRound}`
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Live Multiplier
            </p>

            <p className="mt-1 text-xl font-bold text-amber-400">
              {currentMultiplier !==
              null
                ? `${currentMultiplier.toFixed(
                    2
                  )}x`
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Platform State
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {settings.maintenance
                ? "Maintenance"
                : settings.enabled
                ? "Active"
                : "Disabled"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Main Settings */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1828]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-cyan-400" />

                <h2 className="font-semibold text-white">
                  Game Settings
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Configure operational limits
                for virtual credits.
              </p>
            </div>

            <div className="space-y-5 p-5">

              {/* Enable */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#081421] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <PlayCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-medium text-slate-200">
                      Aviator Game
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Allow players to access
                      the Aviator game.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void toggleGame()
                  }
                  disabled={saving}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    settings.enabled
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {settings.enabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-4 w-4" />
                      Disabled
                    </>
                  )}
                </button>
              </div>

              {/* Maintenance */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#081421] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Settings2 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-medium text-slate-200">
                      Maintenance Mode
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Temporarily stop new game
                      activity during
                      maintenance.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void toggleMaintenance()
                  }
                  disabled={saving}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    settings.maintenance
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {settings.maintenance
                    ? "Maintenance On"
                    : "Maintenance Off"}
                </button>
              </div>

              {/* Min / Max Bet */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Minimum Virtual Bet
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      min={0}
                      value={settings.minBet}
                      onChange={(event) =>
                        setSettings(
                          (previous) => ({
                            ...previous,
                            minBet:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        )
                      }
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-8 pr-3 text-sm text-white outline-none focus:border-cyan-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Maximum Virtual Bet
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      min={0}
                      value={settings.maxBet}
                      onChange={(event) =>
                        setSettings(
                          (previous) => ({
                            ...previous,
                            maxBet:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        )
                      }
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-8 pr-3 text-sm text-white outline-none focus:border-cyan-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Maximum Crash Multiplier */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Maximum Crash Multiplier
                </label>

                <div className="relative">
                  <Zap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />

                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step={0.01}
                    value={
                      settings.maxCrashMultiplier
                    }
                    onChange={(event) =>
                      setSettings(
                        (previous) => ({
                          ...previous,

                          maxCrashMultiplier:
                            Math.max(
                              1,
                              Math.min(
                                1000,
                                Number(
                                  event.target
                                    .value
                                ) || 1
                              )
                            ),
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-amber-500/20 bg-[#081421] pl-10 pr-16 text-sm font-semibold text-amber-300 outline-none focus:border-amber-500/50"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    max
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Minimum possible crash:
                    <span className="ml-1 font-semibold text-slate-300">
                      1.00x
                    </span>
                  </span>

                  <span className="font-semibold text-amber-400">
                    Up to{" "}
                    {Number(
                      settings.maxCrashMultiplier
                    ).toFixed(2)}
                    x
                  </span>
                </div>
              </div>

              {/* Waiting Time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Waiting / Betting Time
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={
                      settings.waitingTime
                    }
                    onChange={(event) =>
                      setSettings(
                        (previous) => ({
                          ...previous,
                          waitingTime:
                            Number(
                              event.target
                                .value
                            ),
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-10 pr-16 text-sm text-white outline-none focus:border-cyan-500/40"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    seconds
                  </span>
                </div>
              </div>

              {/* Save */}
              <button
                type="button"
                onClick={() =>
                  void saveSettings()
                }
                disabled={saving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-4 w-4" />
                    Save Game Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Information */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1828]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />

                <h2 className="font-semibold text-white">
                  Live Game Information
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Current server-side game state.
              </p>
            </div>

            <div className="space-y-3 p-5">

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Game
                </span>

                <span className="font-medium text-white">
                  Aviator
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Round
                </span>

                <span className="font-medium text-white">
                  {currentRound
                    ? `#${currentRound}`
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span
                  className={
                    roundRunning
                      ? "font-medium text-emerald-400"
                      : "font-medium text-amber-400"
                  }
                >
                  {roundRunning
                    ? "RUNNING"
                    : "WAITING"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Multiplier
                </span>

                <span className="font-medium text-amber-400">
                  {currentMultiplier !==
                  null
                    ? `${currentMultiplier.toFixed(
                        2
                      )}x`
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Maximum Crash
                </span>

                <span className="font-semibold text-amber-400">
                  {Number(
                    settings.maxCrashMultiplier
                  ).toFixed(2)}
                  x
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                <span className="text-sm text-slate-500">
                  Started
                </span>

                <span className="text-right text-xs text-slate-300">
                  {formatDate(
                    status?.round
                      ?.startedAt
                  )}
                </span>
              </div>

              {status?.round?.crashedAt && (
                <div className="flex items-center justify-between rounded-xl bg-[#081421] px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Last Crash
                  </span>

                  <span className="text-right text-xs text-slate-300">
                    {formatDate(
                      status.round
                        .crashedAt
                    )}
                  </span>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />

                  <div>
                    <p className="text-sm font-semibold text-cyan-300">
                      Multiplier Range
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Current demo rounds can
                      crash from 1.00x up to the
                      configured maximum of{" "}
                      <span className="font-semibold text-slate-300">
                        {Number(
                          settings.maxCrashMultiplier
                        ).toFixed(2)}
                        x
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1828] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />

            <div>
              <p className="text-sm font-semibold text-slate-200">
                Admin control policy
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Admin controls are limited to
                legitimate platform operations.
                Player balances shown here are
                virtual credits and are not
                real-money funds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}