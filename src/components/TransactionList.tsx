import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export type WalletTransaction = {
  id: string;
  type: "debit" | "credit" | "withdraw";
  amount: number;
  message: string;
  status: "pending" | "success" | "rejected";
  created_at: string;
};

const LABELS: Record<WalletTransaction["type"], string> = {
  credit: "Winnings",
  debit: "Joined Match",
  withdraw: "Withdraw",
};

export const TransactionList = ({ items, emptyText = "No transactions yet" }: { items: WalletTransaction[]; emptyText?: string }) => {
  if (items.length === 0) {
    return <div className="border-y border-primary/20 py-8 text-center text-xs text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="divide-y divide-primary/15 border-y border-primary/20">
      {items.map((tx) => {
        const credit = tx.type === "credit";
        const withdraw = tx.type === "withdraw";
        const Icon = credit ? ArrowDown : withdraw ? Wallet : ArrowUp;
        return (
          <div key={tx.id} className="flex items-center gap-3 py-3 animate-float-up">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-transparent",
                credit ? "border-green-400/70 text-green-400" : withdraw ? "border-primary/70 text-primary" : "border-destructive/70 text-destructive"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-foreground">{LABELS[tx.type] ?? tx.message}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
              {tx.status === "pending" && <p className="mt-0.5 text-[10px] text-primary">Pending review</p>}
            </div>
            <div className="text-right">
              <p className={cn("font-display text-sm font-bold", credit ? "text-green-400" : "text-destructive")}>{credit ? "+" : "-"}{tx.amount}</p>
              <p className="text-[10px] text-muted-foreground">Coins</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};