import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/ride-intel/AuthPanel";
import { Button } from "@/components/ui/button";
import { useRideIntelAuth } from "@/hooks/useRideIntelAuth";

const Auth = () => {
  const auth = useRideIntelAuth();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="space-y-6 rounded-[calc(var(--radius)+8px)] border border-border/70 bg-panel/85 p-6 shadow-glow backdrop-blur-md">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 px-3 py-1 text-xs text-muted-foreground">
            Secure account access
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Sign in or create your rider account.</h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Access bookings, saved routes, fare history, and your demo payment flow from one dedicated dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Account benefits
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Save trip insights and favorite routes</li>
                <li>Track booked rides and itinerary legs</li>
                <li>Use the fake payment flow safely for demos</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border/70 bg-background/40 p-4">
              <div className="text-sm font-medium">Quick navigation</div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button asChild variant="glass">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                    Back to planner
                  </Link>
                </Button>
                <Button asChild variant="hero">
                  <Link to="/bookings">Open bookings</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <AuthPanel isAuthenticated={auth.isAuthenticated} loading={auth.loading} profile={auth.profile} />
      </div>
    </main>
  );
};

export default Auth;