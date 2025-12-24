import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoading } from "@/components/common/LoadingSpinner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load other pages for better performance
const Orphans = lazy(() => import("./pages/Orphans"));
const OrphanDetails = lazy(() => import("./pages/OrphanDetails"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const SponsorThankYou = lazy(() => import("./pages/SponsorThankYou"));
const About = lazy(() => import("./pages/About"));
const Sponsorship = lazy(() => import("./pages/Sponsorship"));
const ReceiptPage = lazy(() => import("./pages/ReceiptPage"));
const Profile = lazy(() => import("./pages/Profile"));
const MyReceipts = lazy(() => import("./pages/MyReceipts"));
const DepositReceiptRequest = lazy(() => import("./pages/DepositReceiptRequest"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const OrphansManagement = lazy(() => import("./pages/admin/OrphansManagement"));
const SponsorsManagement = lazy(() => import("./pages/admin/SponsorsManagement"));
const SponsorshipsManagement = lazy(() => import("./pages/admin/SponsorshipsManagement"));
const ReceiptsManagement = lazy(() => import("./pages/admin/ReceiptsManagement"));
const DepositRequestsManagement = lazy(() => import("./pages/admin/DepositRequestsManagement"));
const NotificationsLog = lazy(() => import("./pages/admin/NotificationsLog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper for lazy loaded routes
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      {children}
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Critical Routes - Eagerly loaded */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* Public Routes - Lazy loaded */}
              <Route path="/orphans" element={<LazyRoute><Orphans /></LazyRoute>} />
              <Route path="/orphan/:id" element={<LazyRoute><OrphanDetails /></LazyRoute>} />
              <Route path="/thank-you/:receiptNumber" element={<LazyRoute><ThankYou /></LazyRoute>} />
              <Route path="/thanks" element={<LazyRoute><SponsorThankYou /></LazyRoute>} />
              <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
              <Route path="/sponsorship" element={<LazyRoute><Sponsorship /></LazyRoute>} />
              <Route path="/receipt/:receiptNumber" element={<LazyRoute><ReceiptPage /></LazyRoute>} />
              <Route path="/profile" element={<LazyRoute><Profile /></LazyRoute>} />
              <Route path="/my-receipts" element={<LazyRoute><MyReceipts /></LazyRoute>} />
              <Route path="/deposit-request" element={<LazyRoute><DepositReceiptRequest /></LazyRoute>} />

              {/* Admin Routes - Lazy loaded with protection */}
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <LazyRoute><AdminDashboard /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/orphans" element={
                <ProtectedAdminRoute>
                  <LazyRoute><OrphansManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/sponsors" element={
                <ProtectedAdminRoute>
                  <LazyRoute><SponsorsManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/sponsorships" element={
                <ProtectedAdminRoute>
                  <LazyRoute><SponsorshipsManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/receipts" element={
                <ProtectedAdminRoute>
                  <LazyRoute><ReceiptsManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/deposit-requests" element={
                <ProtectedAdminRoute>
                  <LazyRoute><DepositRequestsManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/notifications" element={
                <ProtectedAdminRoute>
                  <LazyRoute><NotificationsLog /></LazyRoute>
                </ProtectedAdminRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;