import {
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { api } from "../services/api";

interface NavbarProps {
  balance?: number;
}

export default function Navbar({
  balance: propBalance,
}: NavbarProps) {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [walletBalance, setWalletBalance] =
    useState<number>(
      Number.isFinite(
        propBalance
      )
        ? Number(propBalance)
        : 0
    );

  const token =
    localStorage.getItem(
      "bd_best_betting_token"
    );

  const storedUser =
    localStorage.getItem(
      "bd_best_betting_user"
    );

  let user: {
    name?: string;
    role?: string;
  } | null = null;

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    user = null;
  }

  const isAdmin =
    user?.role === "ADMIN";

  /*
   * --------------------------------------------------------
   * LOAD REAL WALLET BALANCE
   * --------------------------------------------------------
   */

  const loadWalletBalance =
    useCallback(
      async () => {
        if (!token) {
          return;
        }

        try {
          const response =
            await api.get(
              "/wallet/balance"
            );

          const nextBalance =
            Number(
              response.data?.balance ??
                response.data?.user
                  ?.balance ??
                0
            );

          if (
            Number.isFinite(
              nextBalance
            )
          ) {
            setWalletBalance(
              nextBalance
            );
          }
        } catch (error) {
          console.error(
            "Navbar balance error:",
            error
          );
        }
      },
      [token]
    );

  /*
   * Initial balance load
   */

  useEffect(() => {
    void loadWalletBalance();
  }, [
    loadWalletBalance,
  ]);

  /*
   * Refresh balance whenever
   * the route changes.
   *
   * So when user goes:
   * Dashboard -> Games -> Aviator -> Wallet
   *
   * Navbar gets the latest balance.
   */

  useEffect(() => {
    void loadWalletBalance();
  }, [
    location.pathname,
    loadWalletBalance,
  ]);

  /*
   * Listen for balance updates
   * from other pages.
   *
   * Aviator / Wallet can dispatch:
   *
   * window.dispatchEvent(
   *   new Event("wallet-balance-updated")
   * )
   */

  useEffect(() => {
    const handleBalanceUpdate =
      () => {
        void loadWalletBalance();
      };

    window.addEventListener(
      "wallet-balance-updated",
      handleBalanceUpdate
    );

    return () => {
      window.removeEventListener(
        "wallet-balance-updated",
        handleBalanceUpdate
      );
    };
  }, [
    loadWalletBalance,
  ]);

  /*
   * --------------------------------------------------------
   * NAVIGATION
   * --------------------------------------------------------
   */

  const navItems = [
    {
      label: "Home",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Games",
      path: "/games",
      icon: Gamepad2,
    },
    {
      label: "Wallet",
      path: "/wallet",
      icon: WalletCards,
    },
  ];

  /*
   * --------------------------------------------------------
   * LOGOUT
   * --------------------------------------------------------
   */

  function logout() {
    localStorage.removeItem(
      "bd_best_betting_token"
    );

    localStorage.removeItem(
      "bd_best_betting_user"
    );

    navigate("/login");
  }

  /*
   * No token = no navbar
   */

  if (!token) {
    return null;
  }

  /*
   * Use real wallet balance.
   *
   * If a parent passes a valid balance,
   * we still prefer the live wallet API
   * because that is the actual source of truth.
   */

  const displayBalance =
    Number(
      walletBalance
    );

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060912]/90 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">

          {/* Brand */}
          <Link
            to="/dashboard"
            className="group flex items-center gap-3"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 shadow-lg shadow-cyan-500/5">
              <div className="absolute inset-0 bg-cyan-400/5 transition group-hover:bg-cyan-400/10" />

              <Gamepad2
                size={22}
                className="relative text-cyan-300"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-sm font-black tracking-tight text-white">
                BD BEST{" "}
                <span className="text-cyan-400">
                  BETTING WEB
                </span>
              </div>

              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
                Gaming Platform
              </div>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  location.pathname ===
                  item.path;

                return (
                  <Link
                    key={
                      item.path
                    }
                    to={
                      item.path
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={17}
                    />

                    {item.label}
                  </Link>
                );
              }
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`ml-1 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  location.pathname ===
                  "/admin"
                    ? "bg-purple-400/10 text-purple-300"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <ShieldCheck
                  size={17}
                />

                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Balance */}
            <Link
              to="/wallet"
              className="hidden items-center gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-2 sm:flex"
            >
              <WalletCards
                size={16}
                className="text-cyan-400"
              />

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  Balance
                </div>

                <div className="text-sm font-black text-white">
                  {displayBalance.toFixed(
                    2
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(
                  event
                ) => {
                  event.preventDefault();
                  event.stopPropagation();

                  void loadWalletBalance();
                }}
                className="ml-1 rounded-lg p-1.5 text-slate-600 transition hover:bg-white/10 hover:text-white"
                title="Refresh balance"
              >
                <RefreshCw
                  size={13}
                />
              </button>
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={
                logout
              }
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/[0.05] text-red-400 transition hover:border-red-500/20 hover:bg-red-500/10 sm:flex"
              title="Logout"
            >
              <LogOut
                size={17}
              />
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (value) =>
                    !value
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 md:hidden"
            >
              {mobileOpen ? (
                <X
                  size={20}
                />
              ) : (
                <Menu
                  size={20}
                />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/[0.06] py-4 md:hidden">

            {/* Mobile Balance */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] px-4 py-3">
              <div className="flex items-center gap-3">
                <WalletCards
                  size={18}
                  className="text-cyan-400"
                />

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Balance
                  </div>

                  <div className="text-sm font-black text-white">
                    {displayBalance.toFixed(
                      2
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadWalletBalance()
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
                title="Refresh balance"
              >
                <RefreshCw
                  size={15}
                />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    location.pathname ===
                    item.path;

                  return (
                    <Link
                      key={
                        item.path
                      }
                      to={
                        item.path
                      }
                      onClick={() =>
                        setMobileOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                        active
                          ? "bg-cyan-400/10 text-cyan-300"
                          : "text-slate-400"
                      }`}
                    >
                      <Icon
                        size={18}
                      />

                      {item.label}
                    </Link>
                  );
                }
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() =>
                    setMobileOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-purple-300"
                >
                  <ShieldCheck
                    size={18}
                  />

                  Admin Panel
                </Link>
              )}

              <button
                type="button"
                onClick={
                  logout
                }
                className="mt-2 flex w-full items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/[0.05] px-4 py-3 text-left text-sm font-semibold text-red-400"
              >
                <LogOut
                  size={18}
                />

                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}