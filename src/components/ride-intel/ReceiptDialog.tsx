import { CheckCircle2, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BookingReceipt } from "@/lib/fare-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: BookingReceipt | null;
};

export function ReceiptDialog({ open, onOpenChange, receipt }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-panel text-panel-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Booking confirmed</DialogTitle>
          <DialogDescription>Your payment method has been captured and the receipt is ready.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-success">
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Receipt issued</div>
            <div className="mt-1 text-sm text-foreground">Reference {receipt?.receipt_number ?? "—"}</div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-surface/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Amount paid</span><span className="font-medium">₹{receipt?.amount?.toFixed?.(0) ?? "--"}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{receipt?.payment_method_type ?? "--"} •••• {receipt?.payment_method_last4 ?? "--"}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Provider</span><span className="font-medium">{receipt?.provider_name ?? "Assigned provider"}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{receipt?.receipt_status ?? "confirmed"}</span></div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Confirmation is now linked to your bookings page and ride history.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="hero" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
