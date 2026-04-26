import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { ReactNode } from "react";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin, loading, user } = useAdmin();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Authenticating...</div>
      </div>
    );
  }
  // Not logged in -> redirect to login
  if (!user) return <Navigate to="/login" replace />;
  // Logged in but not admin -> redirect to home
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};
