import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gamepad2,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  mobile?: boolean;
  open?: boolean;
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

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("bd_best_betting_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold tracking-wide text-white">
              BD BEST BET
            </h2>

            <p className="text-[11px] text-slate-500">
              Admin Panel
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  mobile = false,
  open = true,
  onClose,
}: AdminSidebarProps) {
  if (mobile) {
    if (!open) {
      return null;
    }

    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-[270px] border-r border-white/10 bg-[#081421] shadow-2xl">
        <SidebarContent onClose={onClose} />
      </aside>
    );
  }

  return (
    <aside
      className={`flex min-h-screen w-[270px] shrink-0 flex-col border-r border-white/10 bg-[#081421] ${
        open ? "" : "hidden"
      }`}
    >
      <SidebarContent />
    </aside>
  );
}