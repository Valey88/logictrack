import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { LiveMap } from "./pages/LiveMap";
import { FuelAnalytics } from "./pages/FuelAnalytics";
import { Fleet } from "./pages/Fleet";
import { Logistics } from "./pages/Logistics";
import { DriverApp } from "./pages/DriverApp";
import { ClientTracking } from "./pages/ClientTracking";
import { OrderTracking } from "./pages/OrderTracking";
import { Maintenance } from "./pages/Maintenance";
import { Drivers } from "./pages/Drivers";
import { Settings } from "./pages/Settings";
import { VehicleDetails } from "./pages/VehicleDetails";
import { RoutePlanner } from "./pages/RoutePlanner";
import { ClientDashboard } from "./pages/ClientDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <Layout>
              <LiveMap />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <Layout>
              <FuelAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fleet"
        element={
          <ProtectedRoute>
            <Layout>
              <Fleet />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fleet/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <VehicleDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logistics"
        element={
          <ProtectedRoute>
            <Layout>
              <Logistics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <Layout>
              <RoutePlanner />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Layout>
              <Maintenance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <Layout>
              <Drivers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Order Tracking - Protected but accessible after login */}
      <Route
        path="/track/:orderId"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderTracking />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* External / Standalone Apps */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute>
            <DriverApp />
          </ProtectedRoute>
        }
      />
      <Route path="/client" element={<ClientTracking />} />
      <Route
        path="/client-portal"
        element={
          <ProtectedRoute>
            <Layout>
              <ClientDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
