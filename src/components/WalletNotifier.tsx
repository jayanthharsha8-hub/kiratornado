import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { playSound } from "@/hooks/useSound";

/**
 * Listens for wallet_requests status changes for the current user
 * and surfaces an in-app notification when the admin approves or rejects.
 */
export const WalletNotifier = () => {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallet_requests",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string; type: string; amount: number };
          if (!row || seen.current.has(row.id + row.status)) return;
          seen.current.add(row.id + row.status);

          if (row.status === "approved" && row.type === "withdraw") {
            playSound("pulse");
            toast.success("Withdrawal Successful", {
              description: "Amount will be credited within 3 hours.",
              duration: 6000,
            });
          } else if (row.status === "rejected" && row.type === "withdraw") {
            toast.error("Withdrawal Rejected", {
              description: `${row.amount} coins refunded to your wallet.`,
              duration: 6000,
            });
          } else if (row.status === "approved" && row.type === "add") {
            playSound("pulse");
            toast.success("Coins Added", {
              description: `${row.amount} coins credited to your wallet.`,
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};
