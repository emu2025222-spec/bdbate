import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-slate-950/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
          >
            <Menu size={22} />
          </button>

          <div className="ml-3">
            <p className="text-sm font-bold text-white">
              BD BEST BETTING WEB
            </p>
            <p className="text-[11px] text-slate-400">
              Admin Panel
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-0px)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}