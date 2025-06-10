import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, lazy, Suspense } from "react";

// Components
import Spinner from "./components/Spinner";
import Layout from "./components/Layout";
import AuthLayout from "./components/auth/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Modal from "./components/Modal";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load heavy components for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const Profile = lazy(() => import("./pages/Profile"));
const Health = lazy(() => import("./pages/Health"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

// Dashboard Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Deployments = lazy(() => import("./pages/Deployments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CLI = lazy(() => import("./pages/CLI"));
const APITester = lazy(() => import("./pages/APITester"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Integrations = lazy(() => import("./pages/Integrations"));

// Product Pages
const AIDeployment = lazy(() => import("./pages/products/AIDeployment"));
const CodeAnalysis = lazy(() => import("./pages/products/CodeAnalysis"));
const CloudIntegration = lazy(() =>
  import("./pages/products/CloudIntegration")
);
const SecurityShield = lazy(() => import("./pages/products/SecurityShield"));

// Resource Pages
const Documentation = lazy(() => import("./pages/Documentation"));
const SupportCenter = lazy(() => import("./pages/SupportCenter"));
const Community = lazy(() => import("./pages/Community"));
const Blog = lazy(() => import("./pages/Blog"));

// Download Pages
const CLITool = lazy(() => import("./pages/downloads/CLITool"));
const SDK = lazy(() => import("./pages/downloads/SDK"));

// Keep frequently accessed pages non-lazy
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { getMe } from "./redux/slices/authSlice";

// Layout Components
const DashboardLayout = lazy(() =>
  import("./components/layouts/DashboardLayout")
);
const ResourcesLayout = lazy(() =>
  import("./components/layouts/ResourcesLayout")
);
const DownloadsLayout = lazy(() =>
  import("./components/layouts/DownloadsLayout")
);
const ProductsLayout = lazy(() =>
  import("./components/layouts/ProductsLayout")
);

function App() {
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  if (loading.me) {
    return <Spinner fullScreen={true} />;
  }

  return (
    <>
      <Suspense fallback={<Spinner fullScreen={true} />}>
        <Routes>
          {/* Auth Layout Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="verify-otp" element={<VerifyOtp />} />
          </Route>{" "}
          {/* Main Layout Routes */}
          <Route path="/" element={<Layout />}>
            {/* Public Pages */}
            <Route index element={<Home />} />
            <Route path="health" element={<Health />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />

            {/* Product Pages with Layout */}
            <Route path="products" element={<ProductsLayout />}>
              <Route path="ai-deployment" element={<AIDeployment />} />
              <Route path="code-analysis" element={<CodeAnalysis />} />
              <Route path="cloud-integration" element={<CloudIntegration />} />
              <Route path="security" element={<SecurityShield />} />
            </Route>

            {/* Resource Pages with Layout */}
            <Route path="resources" element={<ResourcesLayout />}>
              <Route path="docs" element={<Documentation />} />
              <Route path="support" element={<SupportCenter />} />
              <Route path="community" element={<Community />} />
              <Route path="blog" element={<Blog />} />
            </Route>

            {/* Download Pages with Layout */}
            <Route path="downloads" element={<DownloadsLayout />}>
              <Route path="cli" element={<CLITool />} />
              <Route path="sdk" element={<SDK />} />
            </Route>

            {/* Protected Dashboard Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="deployments" element={<Deployments />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="cli" element={<CLI />} />
                <Route path="api-tester" element={<APITester />} />
                <Route path="monitoring" element={<Monitoring />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Modal />
      <ScrollToTop />
    </>
  );
}

export default App;
