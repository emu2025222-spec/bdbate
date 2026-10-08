import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gamepad2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    path: "/admin/clients",
    icon: Users,
  },
  {
    label: "Deposits",
    path: "/admin/deposits",
    icon: ArrowDownCircle,
  },
  {
    label: "Withdrawals",
    path: "/admin/withdrawals",
    icon: ArrowUpCircle,
  },
  {
    label: "Transactions",
    path: "/admin/transactions",
    icon: History,
  },
  {
    label: "Game Management",
    path: "/admin/game",
    icon: Gamepad2,
  },
];

export default function AdminSidebar({
  mobile = false,
  onClose,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);

    localStorage.removeItem("bd_best_betting_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });

    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`flex h-full w-[270px] flex-col border-r border-white/10 bg-[#081421] ${
        mobile ? "" : "min-h-screen"
      }`}
    >
      {/* Brand */}
      <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
        <button
          type="button"
          onClick={() => {
            navigate("/admin");
            onClose?.();
          }}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold tracking-wide text-white">
              BD BEST BETTING
            </p>

            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Admin Panel
            </p>
          </div>
        </button>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Management
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-white/[0.03] text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <span className="flex-1">{item.label}</span>

                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="my-5 h-px bg-white/5" />

        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Game
        </p>

        <NavLink
          to="/games"
          onClick={onClose}
          className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] text-slate-500 group-hover:text-slate-300">
            <Gamepad2 className="h-[18px] w-[18px]" />
          </span>

          <span>View Games</span>
        </NavLink>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-medium text-slate-300">
              Admin Session
            </span>
          </div>

          <p className="mt-1 text-[10px] text-slate-500">
            Control panel is active
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03]">
            <LogOut className="h-[18px] w-[18px]" />
          </span>

          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}