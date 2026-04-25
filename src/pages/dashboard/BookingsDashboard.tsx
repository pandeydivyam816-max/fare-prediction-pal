import { BookingsPage } from "@/components/ride-intel/BookingsPage";
import { useRideIntel } from "@/context/RideIntelContext";

export default function BookingsDashboard() {
  const { rides, itineraries, itineraryStops, receipts, handleCancelRide, cancelingRideId } = useRideIntel();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-sm text-muted-foreground">Active rides, itineraries, and recent receipts.</p>
      </div>
      <BookingsPage
        rides={rides}
        itineraries={itineraries}
        itineraryStops={itineraryStops}
        receipts={receipts}
        onCancelRide={handleCancelRide}
        cancelingRideId={cancelingRideId}
      />
    </div>
  );
}
