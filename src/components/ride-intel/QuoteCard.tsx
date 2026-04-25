import { forwardRef } from "react";
import { BadgeIndianRupee, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ComparisonQuote } from "@/lib/fare-api";

type Props = {
  quote: ComparisonQuote;
  index: number;
  isBooked: boolean;
  canBook: boolean;
  booking: boolean;
  onBook: (quote: ComparisonQuote) => void;
};

export const QuoteCard = forwardRef<HTMLDivElement, Props>(({ quote, index, isBooked, canBook, booking, onBook }, ref) => {
  return (
    <Card ref={ref} className="border-border/70 bg-panel/90 shadow-panel">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BadgeIndianRupee className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{quote.providerName}</h3>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{quote.rideType}</span>
                  {index === 0 ? <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">Best value</span> : null}
                  {isBooked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Booked
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{quote.explanation}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-right">
            <div className="text-2xl font-semibold">₹{quote.estimatedFare.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">ETA {quote.etaMinutes} min • Confidence {quote.confidence}%</div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant={isBooked ? "glass" : "hero"} onClick={() => onBook(quote)} disabled={booking || !canBook}>
            <CheckCircle2 className="h-4 w-4" />
            {isBooked ? "Booked" : booking ? "Booking..." : canBook ? "Book this ride" : "Sign in to book"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

QuoteCard.displayName = "QuoteCard";
