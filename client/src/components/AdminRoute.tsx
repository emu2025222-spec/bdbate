import { Navigate, Outlet, useLocation } from "react-router-dom";

interface StoredUser {
  role?: string;
}

export default function AdminRoute() {
  const location = useLocation();

  const token =
    localStorage.getItem("bd_best_betting_token") ||
    localStorage.getItem("token");

  // Login না থাকলে login page
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  let user: StoredUser | null = null;

  try {
    const rawUser = localStorage.getItem("user");

    if (rawUser) {
      user = JSON.parse(rawUser);
    }
  } catch (error) {
    console.error("Admin user parse error:", error);
  }

  // শুধু ADMIN access পাবে
  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}