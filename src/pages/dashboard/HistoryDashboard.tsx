import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRideIntel } from "@/context/RideIntelContext";

export default function HistoryDashboard() {
  const { rides, handleCancelRide, cancelingRideId } = useRideIntel();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">Recent routes captured for analytics and model tuning.</p>
      </div>
      <Card className="border-border/70 bg-panel/90 shadow-panel">
        <CardHeader>
          <CardTitle className="text-lg">Ride history</CardTitle>
          <CardDescription>{rides.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rides.length ? rides.map((ride) => (
            <div key={ride.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{ride.pickup_label} → {ride.drop_label}</div>
                <div className="text-sm text-muted-foreground">{ride.distance_km.toFixed(1)} km • {ride.duration_minutes.toFixed(0)} min • {ride.trip_status}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" />₹{ride.actual_fare ?? ride.predicted_fare ?? ride.quoted_fare ?? 0}</div>
                {ride.trip_status === "planned" || ride.trip_status === "booked" ? (
                  <Button type="button" size="sm" variant="destructive" onClick={() => handleCancelRide(ride.id)} disabled={cancelingRideId === ride.id}>
                    {cancelingRideId === ride.id ? "Canceling..." : "Cancel"}
                  </Button>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">
              Save a trip after comparison to start building trend analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
