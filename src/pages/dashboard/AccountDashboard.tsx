import { AuthPanel } from "@/components/ride-intel/AuthPanel";
import { useRideIntel } from "@/context/RideIntelContext";

export default function AccountDashboard() {
  const { auth } = useRideIntel();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">Profile and session details.</p>
      </div>
      <div className="max-w-xl">
        <AuthPanel isAuthenticated={auth.isAuthenticated} loading={auth.loading} profile={auth.profile} />
      </div>
    </div>
  );
}
