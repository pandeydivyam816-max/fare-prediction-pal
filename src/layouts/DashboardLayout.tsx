import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, BookmarkCheck, History, LayoutDashboard, LogOut, Receipt, ScanSearch, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useRideIntel } from "@/context/RideIntelContext";
import { BookingDialog } from "@/components/ride-intel/BookingDialog";
import { ReceiptDialog } from "@/components/ride-intel/ReceiptDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { title: "Compare", url: "/compare", icon: ScanSearch },
  { title: "Bookings", url: "/bookings", icon: Receipt },
  { title: "Predict", url: "/predictions", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
  { title: "Favorites", url: "/favorites", icon: BookmarkCheck },
  { title: "Account", url: "/account", icon: UserCircle },
];

function AppSidebar() {
  const { auth } = useRideIntel();
  const { isMobile, setOpenMobile } = useSidebar();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Ride Intel</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-2 px-2 pb-2 text-xs text-muted-foreground">
          <div className="truncate">{auth.user?.email}</div>
          <Button size="sm" variant="glass" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopDashboardNav() {
  return (
    <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-3 py-2">
      {navItems.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          activeClassName="bg-muted text-primary font-medium"
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  const { auth, bookingDialogOpen, setBookingDialogOpen, selectedQuote, saving, itineraryRouteStops, finalizeBooking, receiptDialogOpen, setReceiptDialogOpen, activeReceipts } = useRideIntel();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [auth.loading, auth.isAuthenticated, navigate]);

  if (auth.loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading your dashboard...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-panel/90 backdrop-blur">
            <div className="flex h-12 items-center">
              <SidebarTrigger className="ml-2 shrink-0" />
              <TopDashboardNav />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} quote={selectedQuote} saving={saving} stops={itineraryRouteStops} onConfirm={finalizeBooking} />
      <ReceiptDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} receipts={activeReceipts} />
    </SidebarProvider>
  );
}
