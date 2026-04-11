import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import Settings from "./pages/Settings";
// Renewals
import RenewalsManager from "./pages/renewals/RenewalsManager";

// Document Pages
import DocumentsManager from "./pages/document/DocumentsManager";
import DocumentRenewal from "./pages/document/Renewal";

// Subscription Pages
import AllSubscriptions from "./pages/subscription/AllSubscriptions";
import SubscriptionApproval from "./pages/subscription/Approval";
import SubscriptionPayment from "./pages/subscription/Payment";


// Main Router Configuration
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Document Routes */}
          <Route path="document">
            <Route index element={<DocumentsManager />} />
            <Route path="renewal" element={<DocumentRenewal />} />
          </Route>

          {/* Renewal Routes */}
          <Route path="renewal" element={<RenewalsManager />} />

          {/* Subscription Routes */}
          <Route path="subscription">
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<AllSubscriptions />} />
            <Route path="approval" element={<SubscriptionApproval />} />
            <Route path="payment" element={<SubscriptionPayment />} />
          </Route>

          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;