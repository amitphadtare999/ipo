import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

const LoginPage           = lazy(() => import("@/pages/LoginPage"));
const IpoListPage         = lazy(() => import("@/pages/IpoListPage"));
const IpoDetailPage       = lazy(() => import("@/pages/IpoDetailPage"));
const DematAccountsPage   = lazy(() => import("@/pages/DematAccountsPage"));
const DematAccountDetailPage = lazy(() => import("@/pages/DematAccountDetailPage"));
const DashboardPage       = lazy(() => import("@/pages/DashboardPage"));

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<IpoListPage />} />
              <Route path="/ipo/:id" element={<IpoDetailPage />} />
              <Route path="/demat-accounts" element={<DematAccountsPage />} />
              <Route path="/demat-accounts/:id" element={<DematAccountDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
