import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import AddCredits from "./pages/AddCredits";
import Games from "./pages/Games";
import Aviator from "./pages/Aviator";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Clients from "./pages/admin/Clients";
import Deposits from "./pages/admin/Deposits";
import Withdrawals from "./pages/admin/Withdrawals";
import Transactions from "./pages/admin/Transactions";
import GameManagement from "./pages/admin/GameManagement";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            PROTECTED USER ROUTES
        ========================== */}

        <Route element={<ProtectedRoute />}>
          {/* User Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Wallet */}
          <Route
            path="/wallet"
            element={<Wallet />}
          />

          {/* Add Credits */}
          <Route
            path="/add-credits"
            element={<AddCredits />}
          />

          {/* Games */}
          <Route
            path="/games"
            element={<Games />}
          />

          {/* Aviator */}
          <Route
            path="/games/aviator"
            element={<Aviator />}
          />

          {/* =========================
              ADMIN PANEL
          ========================== */}

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/clients"
            element={<Clients />}
          />

          <Route
            path="/admin/deposits"
            element={<Deposits />}
          />

          <Route
            path="/admin/withdrawals"
            element={<Withdrawals />}
          />

          <Route
            path="/admin/transactions"
            element={<Transactions />}
          />

          <Route
            path="/admin/game"
            element={<GameManagement />}
          />
        </Route>

        {/* =========================
            FALLBACK
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}