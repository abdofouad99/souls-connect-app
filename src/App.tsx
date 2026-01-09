import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
const MyRequests = lazy(() => import("./pages/MyRequests"));
const ReceiptLookup = lazy(() => import("./pages/ReceiptLookup"));
const DepositReceiptRequest = lazy(() => import("./pages/DepositReceiptRequest"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const OrphansManagement = lazy(() => import("./pages/admin/OrphansManagement"));
const SponsorsManagement = lazy(() => import("./pages/admin/SponsorsManagement"));
const SponsorshipsManagement = lazy(() => import("./pages/admin/SponsorshipsManagement"));
const SponsorshipRequestsManagement = lazy(() => import("./pages/admin/SponsorshipRequestsManagement"));
const ReceiptsManagement = lazy(() => import("./pages/admin/ReceiptsManagement"));
const DepositRequestsManagement = lazy(() => import("./pages/admin/DepositRequestsManagement"));
const BankAccountsManagement = lazy(() => import("./pages/admin/BankAccountsManagement"));
const NotificationsLog = lazy(() => import("./pages/admin/NotificationsLog"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const SetPassword = lazy(() => import("./pages/SetPassword"));

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
              {/* Public Routes - No auth required */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
              <Route path="/thanks" element={<LazyRoute><SponsorThankYou /></LazyRoute>} />
              <Route path="/thank-you/:receiptNumber" element={<LazyRoute><ThankYou /></LazyRoute>} />
              <Route path="/set-password" element={<LazyRoute><SetPassword /></LazyRoute>} />

              {/* Public Routes - No auth required */}
              <Route path="/orphans" element={<LazyRoute><Orphans /></LazyRoute>} />
              <Route path="/orphan/:id" element={<LazyRoute><OrphanDetails /></LazyRoute>} />
              <Route path="/sponsorship" element={<LazyRoute><Sponsorship /></LazyRoute>} />

              {/* Protected Routes - Auth required */}
              <Route path="/receipt/:receiptNumber" element={
                <ProtectedRoute>
                  <LazyRoute><ReceiptPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <LazyRoute><Profile /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/my-receipts" element={
                <ProtectedRoute>
                  <LazyRoute><MyReceipts /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/my-requests" element={
                <ProtectedRoute>
                  <LazyRoute><MyRequests /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/deposit-request" element={
                <ProtectedRoute>
                  <LazyRoute><DepositReceiptRequest /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/receipt-lookup" element={
                <ProtectedRoute>
                  <LazyRoute><ReceiptLookup /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* Admin Routes - Admin/Staff auth required */}
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
              <Route path="/admin/sponsorship-requests" element={
                <ProtectedAdminRoute>
                  <LazyRoute><SponsorshipRequestsManagement /></LazyRoute>
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
              <Route path="/admin/bank-accounts" element={
                <ProtectedAdminRoute>
                  <LazyRoute><BankAccountsManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/notifications" element={
                <ProtectedAdminRoute>
                  <LazyRoute><NotificationsLog /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <LazyRoute><UsersManagement /></LazyRoute>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedAdminRoute>
                  <LazyRoute><SiteSettings /></LazyRoute>
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
