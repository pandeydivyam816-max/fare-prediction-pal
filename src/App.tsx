import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RideIntelProvider } from "@/context/RideIntelContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import Compare from "@/pages/dashboard/Compare";
import BookingsDashboard from "@/pages/dashboard/BookingsDashboard";
import Predictions from "@/pages/dashboard/Predictions";
import HistoryDashboard from "@/pages/dashboard/HistoryDashboard";
import FavoritesDashboard from "@/pages/dashboard/FavoritesDashboard";
import AccountDashboard from "@/pages/dashboard/AccountDashboard";
import NotFound from "./pages/NotFound.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Auth from "./pages/Auth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RideIntelProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/compare" replace />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/bookings" element={<BookingsDashboard />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/history" element={<HistoryDashboard />} />
              <Route path="/favorites" element={<FavoritesDashboard />} />
              <Route path="/account" element={<AccountDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RideIntelProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
