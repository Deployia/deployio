import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, lazy, Suspense } from "react";

// Core Components
import Spinner from "@components/Spinner";
import Layout from "@components/Layout";
import Modal from "@components/Modal";
import ScrollToTop from "@components/ScrollToTop";

// Hooks
import useNotifications from "@hooks/useNotifications";

// Lazy loaded components for performance optimization
import Home from "@pages/marketing/Home";
import NotFound from "@pages/NotFound";
import { getMe } from "@redux/index";
const Health = lazy(() => import("@pages/Health"));
const ServiceDetailPage = lazy(() => import("@pages/ServiceDetailPage"));

// Route Groups
import AuthRoutes from "./routes/authRoutes";
import AdminRoutes from "./routes/adminRoutes";
import PlaygroundProtectedRoutes from "./routes/playgroundRoutes";
import ProductRoutes from "./routes/productRoutes";
import ResourcesRoutes from "./routes/resourcesRoutes";
import DownloadsRoutes from "./routes/downloadsRoutes";
import DashboardRoutes from "./routes/dashboardRoutes";
import ProtectedRoute from "./components/ProtectedRoute";

// Legal Pages (used directly in App.jsx)
const PrivacyPolicy = lazy(() => import("@legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@legal/TermsOfService"));
const CookiePolicy = lazy(() => import("@legal/CookiePolicy"));

/**
 * Main App Component
 * Handles routing, authentication, and lazy loading
 */
function App() {
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Initialize notification service using the new hook
  useNotifications();

  // Initialize authentication state on app load
  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  // Show loading spinner while checking authentication
  if (loading.me) {
    return <Spinner fullScreen={true} />;
  }

  return (
    <>
      <Suspense fallback={<Spinner fullScreen={true} />}>
        <Routes>
          {/* Authentication Routes */}
          {AuthRoutes()}
          {/* Protected Admin Routes */}
          {AdminRoutes()}
          {/* Protected Playground Routes */}
          {PlaygroundProtectedRoutes()}
          {/* Main Application Routes */}
          <Route path="/" element={<Layout />}>
            {/* Public Pages */}
            <Route index element={<Home />} />
            <Route path="health" element={<Health />} />
            <Route element={<ProtectedRoute admin />}>
              <Route
                path="health/:serviceName"
                element={<ServiceDetailPage />}
              />
            </Route>
            {/* Legal Pages */}
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />
            {/* Product Pages */}
            {ProductRoutes()}
            {/* Resources */}
            {ResourcesRoutes()}
            {/* Downloads */}
            {DownloadsRoutes()}
            {/* Protected Dashboard Routes */}
            {DashboardRoutes()}
            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Global Components */}
      <Modal />
      <ScrollToTop />
    </>
  );
}

export default App;
