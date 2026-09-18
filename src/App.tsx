import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import IpoListPage from "@/pages/IpoListPage";
import IpoDetailPage from "@/pages/IpoDetailPage";
import DematAccountsPage from "@/pages/DematAccountsPage";
import DematAccountDetailPage from "@/pages/DematAccountDetailPage";
import DashboardPage from "@/pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  );
}
