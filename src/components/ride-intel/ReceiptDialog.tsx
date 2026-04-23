import { CheckCircle2, Receipt, Route, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BookingReceipt } from "@/lib/fare-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipts: BookingReceipt[];
};

export function ReceiptDialog({ open, onOpenChange, receipts }: Props) {
  const primaryReceipt = receipts[0] ?? null;
  const totalPaid = receipts.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const isItinerary = receipts.length > 1 || Boolean(primaryReceipt?.itinerary_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-panel text-panel-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Booking confirmed</DialogTitle>
          <DialogDescription>{isItinerary ? "Your itinerary is booked and receipts were generated for each leg." : "Your payment method has been captured and the receipt is ready."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-success">
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Receipt issued</div>
            <div className="mt-1 text-sm text-foreground">Reference {primaryReceipt?.receipt_number ?? "—"}</div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-surface/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Amount paid</span><span className="font-medium">₹{(isItinerary ? totalPaid : Number(primaryReceipt?.amount ?? 0)).toFixed(0)}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{primaryReceipt?.payment_method_type ?? "--"} •••• {primaryReceipt?.payment_method_last4 ?? "--"}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Provider</span><span className="font-medium">{primaryReceipt?.provider_name ?? "Assigned provider"}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{primaryReceipt?.receipt_status ?? "confirmed"}</span></div>
            {isItinerary ? <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Itinerary legs</span><span className="font-medium">{receipts.length}</span></div> : null}
          </div>

          {isItinerary ? (
            <div className="rounded-lg border border-border/70 bg-background/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Route className="h-4 w-4 text-accent" />
                Itinerary receipt breakdown
              </div>
              <div className="space-y-2">
                {receipts.map((receipt, index) => (
                  <div key={receipt.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-surface/70 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">Leg {index + 1}</div>
                      <div className="text-muted-foreground">{receipt.receipt_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{Number(receipt.amount ?? 0).toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{receipt.receipt_status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
