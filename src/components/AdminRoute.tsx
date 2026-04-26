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
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center scanline px-4">
        <div className="panel max-w-xs p-4 text-center">
          <p className="font-display text-sm font-black uppercase tracking-[0.24em] text-primary text-glow">Access Denied</p>
          <p className="mt-2 text-xs text-muted-foreground">Admin validation failed.</p>
          <Navigate to="/home" replace />
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
