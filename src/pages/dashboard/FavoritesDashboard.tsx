import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRideIntel } from "@/context/RideIntelContext";

export default function FavoritesDashboard() {
  const { favorites } = useRideIntel();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Favorite routes</h1>
        <p className="text-sm text-muted-foreground">Quick-access recurring trips.</p>
      </div>
      <Card className="border-border/70 bg-panel/90 shadow-panel">
        <CardHeader>
          <CardTitle className="text-lg">Saved routes</CardTitle>
          <CardDescription>{favorites.length} favorite(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {favorites.length ? favorites.map((route) => (
            <div key={route.id} className="rounded-lg border border-border/60 bg-surface/70 p-4">
              <div className="font-medium">{route.label}</div>
              <div className="text-sm text-muted-foreground">{route.pickup_label} → {route.drop_label}</div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">
              Save a favorite route after running a fare comparison.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
