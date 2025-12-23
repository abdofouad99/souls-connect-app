import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";

// Public Pages
import Index from "./pages/Index";
import Orphans from "./pages/Orphans";
import OrphanDetails from "./pages/OrphanDetails";
import ThankYou from "./pages/ThankYou";
import About from "./pages/About";
import Auth from "./pages/Auth";
import ReceiptPage from "./pages/ReceiptPage";
import Profile from "./pages/Profile";
import MyReceipts from "./pages/MyReceipts";
import DepositReceiptRequest from "./pages/DepositReceiptRequest";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import OrphansManagement from "./pages/admin/OrphansManagement";
import SponsorsManagement from "./pages/admin/SponsorsManagement";
import SponsorshipsManagement from "./pages/admin/SponsorshipsManagement";
import ReceiptsManagement from "./pages/admin/ReceiptsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/orphans" element={<Orphans />} />
            <Route path="/orphan/:id" element={<OrphanDetails />} />
            <Route path="/thank-you/:receiptNumber" element={<ThankYou />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/receipt/:receiptNumber" element={<ReceiptPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-receipts" element={<MyReceipts />} />
            <Route path="/deposit-request" element={<DepositReceiptRequest />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/orphans" element={
              <ProtectedAdminRoute>
                <OrphansManagement />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/sponsors" element={
              <ProtectedAdminRoute>
                <SponsorsManagement />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/sponsorships" element={
              <ProtectedAdminRoute>
                <SponsorshipsManagement />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/receipts" element={
              <ProtectedAdminRoute>
                <ReceiptsManagement />
              </ProtectedAdminRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
