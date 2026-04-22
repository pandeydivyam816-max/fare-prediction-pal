import { BadgeCheck, CarFront, Clock3, MapPinned, Route, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BookingReceipt, ItineraryRecord, ItineraryStopRecord, RideRecord } from "@/lib/fare-api";

type Props = {
  rides: RideRecord[];
  itineraries: ItineraryRecord[];
  itineraryStops: ItineraryStopRecord[];
  receipts: BookingReceipt[];
  onCancelRide: (rideId: string) => void;
  cancelingRideId?: string | null;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planned: "outline",
  booked: "default",
  completed: "secondary",
  canceled: "destructive",
};

export function BookingsPage({ rides, itineraries, itineraryStops, receipts, onCancelRide, cancelingRideId }: Props) {
  const bookedRides = rides.filter((ride) => ["planned", "booked", "completed", "canceled"].includes(ride.trip_status));
  const bookedItineraries = itineraries.filter((itinerary) => ["planned", "booked", "completed", "canceled"].includes(itinerary.trip_status));

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><CarFront className="h-5 w-5 text-primary" /> My bookings</CardTitle>
            <CardDescription>Track booking status, cancel active rides, and review driver and ETA details.</CardDescription>
          </CardHeader>
          <CardContent>
            {bookedRides.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookedRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>
                        <div className="font-medium">{ride.pickup_label} → {ride.drop_label}</div>
                        <div className="text-xs text-muted-foreground">{ride.booking_reference ?? "Planned route"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[ride.trip_status] ?? "outline"} className="capitalize">{ride.trip_status}</Badge>
                      </TableCell>
                      <TableCell>
                        {ride.driver_name ? (
                          <div>
                            <div className="font-medium">{ride.driver_name}</div>
                            <div className="text-xs text-muted-foreground">{ride.driver_vehicle ?? "Vehicle pending"}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Assigned after booking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ride.eta_minutes ? `${ride.eta_minutes} min` : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{ride.payment_method_type ? `${ride.payment_method_type} •••• ${ride.payment_method_last4 ?? ""}` : "Not added"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {ride.trip_status === "booked" ? (
                          <Button type="button" variant="destructive" size="sm" onClick={() => onCancelRide(ride.id)} disabled={cancelingRideId === ride.id}>
                            <XCircle className="h-4 w-4" />
                            {cancelingRideId === ride.id ? "Canceling..." : "Cancel"}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">Book a ride to see it here.</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Route className="h-5 w-5 text-accent" /> Itineraries</CardTitle>
              <CardDescription>Multi-stop route bundles booked in one confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookedItineraries.length ? bookedItineraries.map((itinerary) => {
                const stops = itineraryStops.filter((stop) => stop.itinerary_id === itinerary.id).sort((a, b) => a.stop_order - b.stop_order);
                return (
                  <div key={itinerary.id} className="rounded-lg border border-border/60 bg-surface/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{itinerary.label}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {stops.map((stop) => <span key={stop.id}>{stop.label}</span>)}
                        </div>
                      </div>
                      <Badge variant={statusVariant[itinerary.trip_status] ?? "outline"} className="capitalize">{itinerary.trip_status}</Badge>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">{stops.length > 1 ? `${stops.length - 1} legs` : "1 leg"} • ₹{(itinerary.quoted_total_fare ?? itinerary.predicted_total_fare ?? 0).toFixed(0)}</div>
                  </div>
                );
              }) : <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">Save an itinerary with extra stops to see it here.</div>}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="h-5 w-5 text-success" /> Recent receipts</CardTitle>
              <CardDescription>Confirmation records from your latest bookings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {receipts.length ? receipts.slice(0, 4).map((receipt) => (
                <div key={receipt.id} className="rounded-lg border border-border/60 bg-surface/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{receipt.receipt_number}</div>
                      <div className="text-sm text-muted-foreground capitalize">{receipt.payment_method_type} •••• {receipt.payment_method_last4}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{receipt.amount.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{receipt.receipt_status}</div>
                    </div>
                  </div>
                </div>
              )) : <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">Receipts appear after booking confirmation.</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardContent className="flex items-center gap-3 p-5">
            <Clock3 className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Active rides</div>
              <div className="text-2xl font-semibold">{bookedRides.filter((ride) => ride.trip_status === "booked").length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardContent className="flex items-center gap-3 p-5">
            <MapPinned className="h-5 w-5 text-accent" />
            <div>
              <div className="text-sm text-muted-foreground">Planned itineraries</div>
              <div className="text-2xl font-semibold">{bookedItineraries.filter((item) => item.trip_status === "planned").length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardContent className="flex items-center gap-3 p-5">
            <BadgeCheck className="h-5 w-5 text-success" />
            <div>
              <div className="text-sm text-muted-foreground">Completed rides</div>
              <div className="text-2xl font-semibold">{bookedRides.filter((ride) => ride.trip_status === "completed").length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
