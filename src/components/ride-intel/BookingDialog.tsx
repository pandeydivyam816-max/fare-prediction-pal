import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComparisonQuote, PaymentMethodInput, RouteStop } from "@/lib/fare-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: ComparisonQuote | null;
  saving: boolean;
  stops: RouteStop[];
  onConfirm: (paymentMethod: PaymentMethodInput) => void;
};

const paymentOptions = [
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Landmark },
  { value: "wallet", label: "Wallet", icon: Wallet },
] as const;

export function BookingDialog({ open, onOpenChange, quote, saving, stops, onConfirm }: Props) {
  const [methodType, setMethodType] = useState<PaymentMethodInput["methodType"]>("card");
  const [providerLabel, setProviderLabel] = useState("Visa");
  const [holderName, setHolderName] = useState("");
  const [last4, setLast4] = useState("");

  useEffect(() => {
    if (!open) return;
    setMethodType("card");
    setProviderLabel("Visa");
    setHolderName("");
    setLast4("");
  }, [open]);

  const estimatedTotal = useMemo(() => {
    if (!quote) return 0;
    const multiplier = Math.max(stops.length - 1, 1);
    return quote.estimatedFare * multiplier;
  }, [quote, stops.length]);

  function handleSubmit() {
    if (holderName.trim().length < 2 || last4.trim().length !== 4) return;
    onConfirm({
      methodType,
      providerLabel: providerLabel.trim(),
      holderName: holderName.trim(),
      last4: last4.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-panel text-panel-foreground sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm booking</DialogTitle>
          <DialogDescription>
            Add a payment method to book {quote?.providerName ?? "this ride"} and generate a receipt instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{quote?.providerName ?? "Selected provider"}</div>
                <div className="text-sm text-muted-foreground">
                  {stops.length > 2 ? `${stops.length - 1} legs booked together` : "Single route booking"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Estimated total</div>
                <div className="text-2xl font-semibold">₹{estimatedTotal.toFixed(0)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment method</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const active = methodType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setMethodType(option.value);
                      setProviderLabel(option.label);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm transition ${active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="providerLabel">Provider label</Label>
              <Input id="providerLabel" value={providerLabel} onChange={(e) => setProviderLabel(e.target.value)} placeholder="Visa / GPay / Paytm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holderName">Name on payment method</Label>
              <Input id="holderName" value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="last4">Last 4 digits</Label>
              <Input id="last4" inputMode="numeric" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="glass" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
          <Button type="button" variant="hero" onClick={handleSubmit} disabled={saving || holderName.trim().length < 2 || last4.trim().length !== 4}>
            {saving ? "Confirming..." : "Pay & book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
