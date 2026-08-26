import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-soft">
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
