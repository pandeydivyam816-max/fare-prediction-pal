import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BookingsPage } from "@/components/ride-intel/BookingsPage";
import { Button } from "@/components/ui/button";
import { useRideIntelAuth } from "@/hooks/useRideIntelAuth";
import { cancelRide, fetchRideHistory, type BookingReceipt, type ItineraryRecord, type ItineraryStopRecord, type RideRecord } from "@/lib/fare-api";

const Bookings = () => {
  const auth = useRideIntelAuth();
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [itineraries, setItineraries] = useState<ItineraryRecord[]>([]);
  const [itineraryStops, setItineraryStops] = useState<ItineraryStopRecord[]>([]);
  const [receipts, setReceipts] = useState<BookingReceipt[]>([]);
  const [cancelingRideId, setCancelingRideId] = useState<string | null>(null);

  async function loadHistory() {
    if (!auth.isAuthenticated) return;
    try {
      const data = await fetchRideHistory();
      setRides(data?.rides ?? []);
      setItineraries(data?.itineraries ?? []);
      setItineraryStops(data?.itineraryStops ?? []);
      setReceipts(data?.receipts ?? []);
    } catch {
      toast.error("Unable to load bookings.");
    }
  }

  useEffect(() => {
    loadHistory();
  }, [auth.isAuthenticated]);

  async function handleCancelRide(rideId: string) {
    try {
      setCancelingRideId(rideId);
      await cancelRide(rideId);
      await loadHistory();
      toast.success("Booking canceled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel booking.");
    } finally {
      setCancelingRideId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
            <p className="text-sm text-muted-foreground">Manage booked rides, itinerary bundles, and receipts.</p>
          </div>
          <Button asChild variant="glass">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to planner
            </Link>
          </Button>
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
    </main>
  );
};

export default Bookings;
