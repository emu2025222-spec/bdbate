import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api, getErrorMessage } from "../../services/api";

interface Client {
  _id: string;
  name: string;
  phone: string;
  role: "PLAYER" | "ADMIN";
  balance: number;
  isBlocked?: boolean;
  createdAt?: string;
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

  return date.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadClients = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/admin/clients");

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.clients)
        ? data.clients
        : [];

      setClients(list);
    } catch (err) {
      console.error("Admin clients error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      client.name?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );
  });

  const totalBalance = clients.reduce(
    (sum, client) => sum + Number(client.balance || 0),
    0
  );

  const openEdit = (client: Client) => {
    setEditClient(client);
    setEditName(client.name || "");
    setEditPhone(client.phone || "");
    setError("");
  };

  const closeEdit = () => {
    if (saving) return;

    setEditClient(null);
    setEditName("");
    setEditPhone("");
  };

  const saveEdit = async () => {
    if (!editClient) return;

    const name = editName.trim();
    const phone = editPhone.trim();

    if (!name) {
      setError("Player name is required.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(`/admin/clients/${editClient._id}`, {
        name,
        phone,
      });

      setClients((current) =>
        current.map((client) =>
          client._id === editClient._id
            ? {
                ...client,
                name,
                phone,
              }
            : client
        )
      );

      closeEdit();
    } catch (err) {
      console.error("Update client error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (client: Client) => {
    if (client.role === "ADMIN") {
      setError("Admin account cannot be blocked from this page.");
      return;
    }

    try {
      setActionLoading(client._id);
      setError("");

      const newBlockedState = !Boolean(client.isBlocked);

      await api.put(`/admin/clients/${client._id}/status`, {
        isBlocked: newBlockedState,
      });

      setClients((current) =>
        current.map((item) =>
          item._id === client._id
            ? {
                ...item,
                isBlocked: newBlockedState,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Toggle client status error:", err);
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteClient) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/admin/clients/${deleteClient._id}`);

      setClients((current) =>
        current.filter((client) => client._id !== deleteClient._id)
      );

      setDeleteClient(null);
    } catch (err) {
      console.error("Delete client error:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading clients...</span>
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
                <Users className="h-6 w-6 text-cyan-400" />

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Clients
                </h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Manage registered players and client accounts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadClients(true)}
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
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-300/70 hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Clients
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {clients.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Player Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {formatMoney(totalBalance)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <WalletCards className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1828] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Search Results
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {filteredClients.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1828] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by client name or phone..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-500/40"
            />
          </div>
        </div>

        {/* Client Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1828]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-white">
                All Clients
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredClients.length} client
                {filteredClients.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
                <UserRound className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-300">
                No clients found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client) => {
                    const blocked = Boolean(client.isBlocked);
                    const isActionLoading = actionLoading === client._id;

                    return (
                      <tr
                        key={client._id}
                        className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                              <UserRound className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-200">
                                {client.name || "Unknown"}
                              </p>

                              <p className="mt-0.5 max-w-[240px] truncate text-xs text-slate-600">
                                ID: {client._id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300">
                          {client.phone || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-400">
                            {formatMoney(client.balance)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                            {client.role === "ADMIN" && (
                              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                            )}

                            {client.role}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(client.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          {blocked ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(client)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            {client.role !== "ADMIN" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void toggleBlock(client)}
                                  disabled={isActionLoading}
                                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    blocked
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                      : "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                  }`}
                                >
                                  {isActionLoading ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : blocked ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}

                                  {blocked ? "Unblock" : "Block"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteClient(client)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1828] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Player
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update player information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Player Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                  placeholder="Player name"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Phone
                </label>

                <input
                  type="text"
                  value={editPhone}
                  onChange={(event) => setEditPhone(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#081421] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                  placeholder="Phone number"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-slate-500">Current Balance</p>
                <p className="mt-1 font-semibold text-emerald-400">
                  {formatMoney(editClient.balance)}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0c1828] shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <Trash2 className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-white">
                Delete Player?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-white">
                  {deleteClient.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteClient(null)}
                  disabled={deleting}
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deleting}
                  className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Player"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}