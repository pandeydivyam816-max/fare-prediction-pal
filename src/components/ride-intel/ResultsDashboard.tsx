import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { BookmarkPlus, Clock3, Route, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ComparisonQuote, FavoriteRoute, PredictResponse, RideRecord, RouteStop } from "@/lib/fare-api";
import { QuoteCard } from "@/components/ride-intel/QuoteCard";

type Props = {
  quotes: ComparisonQuote[];
  prediction: PredictResponse | null;
  rides: RideRecord[];
  favorites: FavoriteRoute[];
  itineraryStops: RouteStop[];
  onSaveTrip: () => void;
  onSaveFavorite: () => void;
  onBookQuote: (quote: ComparisonQuote) => void;
  onSaveItinerary: () => void;
  onBookItinerary: () => void;
  saving: boolean;
  canPersist: boolean;
  bookedQuoteSlug?: string | null;
};

const chartConfig = {
  actual: { label: "Actual", color: "hsl(var(--secondary))" },
  predicted: { label: "Predicted", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export function ResultsDashboard({
  quotes,
  prediction,
  rides,
  favorites,
  itineraryStops,
  onSaveTrip,
  onSaveFavorite,
  onBookQuote,
  onSaveItinerary,
  onBookItinerary,
  saving,
  canPersist,
  bookedQuoteSlug,
}: Props) {
  const bestQuote = quotes[0];
  const worstQuote = quotes[quotes.length - 1];
  const hasStops = itineraryStops.length > 2;

  return (
    <Tabs defaultValue="compare" className="space-y-5">
      <TabsList className="bg-surface/80">
        <TabsTrigger value="compare">Compare</TabsTrigger>
        <TabsTrigger value="prediction">Prediction</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
      </TabsList>

      <TabsContent value="compare" className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div className="grid gap-4">
            {quotes.map((quote, index) => (
              <QuoteCard
                key={`${quote.providerSlug}-${quote.rideType}`}
                quote={quote}
                index={index}
                isBooked={bookedQuoteSlug === quote.providerSlug}
                canBook={canPersist}
                booking={saving}
                onBook={onBookQuote}
              />
            ))}
          </div>
          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-accent" />
                Decision support
              </CardTitle>
              <CardDescription>Actionable signal for this route right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
                <div className="text-sm text-muted-foreground">Cheapest option</div>
                <div className="mt-1 text-xl font-semibold">{bestQuote?.providerName ?? "No quote yet"}</div>
                <div className="text-sm text-success">Save ₹{Math.max((worstQuote?.estimatedFare ?? 0) - (bestQuote?.estimatedFare ?? 0), 0).toFixed(0)}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Button type="button" variant="hero" onClick={onSaveTrip} disabled={!canPersist || saving}>
                  <TrendingUp className="h-4 w-4" />
                  Save trip insight
                </Button>
                <Button type="button" variant="glass" onClick={onSaveFavorite} disabled={!canPersist || saving}>
                  <BookmarkPlus className="h-4 w-4" />
                  Save favorite route
                </Button>
                {hasStops ? (
                  <>
                    <Button type="button" variant="glass" onClick={onSaveItinerary} disabled={!canPersist || saving}>
                      <Route className="h-4 w-4" />
                      Save itinerary
                    </Button>
                    <Button type="button" variant="hero" onClick={onBookItinerary} disabled={saving || !bestQuote}>
                      <Route className="h-4 w-4" />
                      {canPersist ? "Book whole itinerary" : "Sign in to book itinerary"}
                    </Button>
                  </>
                ) : null}
              </div>
              {!canPersist ? <p className="text-sm text-muted-foreground">Sign in to save history, routes, and bookings.</p> : null}
              {hasStops ? <p className="text-sm text-muted-foreground">Multi-stop itinerary detected: save or book all legs in one confirmation.</p> : null}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="prediction">
        <div className="grid gap-5 lg:grid-cols-[1.5fr,1fr]">
          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="text-lg">Prediction vs actual trend</CardTitle>
              <CardDescription>Modeled fare band compared with recent rides.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer>
                  <AreaChart data={prediction?.trend ?? []}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="actual" stroke="var(--color-actual)" fill="var(--color-actual)" fillOpacity={0.12} />
                    <Area type="monotone" dataKey="predicted" stroke="var(--color-predicted)" fill="var(--color-predicted)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="text-lg">Forecast summary</CardTitle>
              <CardDescription>Expected pricing band for this route.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
                <div className="text-sm text-muted-foreground">Predicted fare</div>
                <div className="mt-1 text-3xl font-semibold">₹{prediction?.predictedFare.toFixed(0) ?? "--"}</div>
                <div className="text-sm text-muted-foreground">₹{prediction?.lowRange.toFixed(0) ?? "--"} to ₹{prediction?.highRange.toFixed(0) ?? "--"}</div>
              </div>
              <div className="space-y-3">
                {prediction?.drivers.map((driver) => (
                  <div key={driver.label} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/50 p-3">
                    <div>
                      <div className="font-medium">{driver.label}</div>
                      <div className="text-sm text-muted-foreground">{driver.impact}</div>
                    </div>
                    <TrendingDown className="mt-1 h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardHeader>
            <CardTitle className="text-lg">Ride history</CardTitle>
            <CardDescription>Recent routes captured for analytics and model tuning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rides.length ? (
              rides.slice(0, 6).map((ride) => (
                <div key={ride.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{ride.pickup_label} → {ride.drop_label}</div>
                    <div className="text-sm text-muted-foreground">{ride.distance_km.toFixed(1)} km • {ride.duration_minutes.toFixed(0)} min • {ride.trip_status === "booked" ? "Booked" : ride.trip_status === "completed" ? "Completed" : ride.trip_status === "canceled" ? "Canceled" : "Planned"}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    ₹{ride.actual_fare ?? ride.predicted_fare ?? ride.quoted_fare ?? 0}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">
                Save a trip after comparison to start building trend analytics.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="favorites">
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardHeader>
            <CardTitle className="text-lg">Favorite routes</CardTitle>
            <CardDescription>Quick-access recurring trips for faster price checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {favorites.length ? (
              favorites.slice(0, 6).map((route) => (
                <div key={route.id} className="rounded-lg border border-border/60 bg-surface/70 p-4">
                  <div className="font-medium">{route.label}</div>
                  <div className="text-sm text-muted-foreground">{route.pickup_label} → {route.drop_label}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">
                Save a favorite route after running a fare comparison.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
