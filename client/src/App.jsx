import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, lazy, Suspense } from "react";

// Core Components
import Spinner from "@components/Spinner";
import Layout from "@components/Layout";
import AuthLayout from "@components/auth/Layout";
import ProtectedRoute from "@components/ProtectedRoute";
import Modal from "@components/Modal";
import ScrollToTop from "@components/ScrollToTop";

// Lazy loaded components for performance optimization
// Authentication Pages
const Login = lazy(() => import("@auth/Login"));
const Register = lazy(() => import("@auth/Register"));
const ForgotPassword = lazy(() => import("@auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@auth/ResetPassword"));
const VerifyOtp = lazy(() => import("@auth/VerifyOtp"));

// Dashboard Pages
const Dashboard = lazy(() => import("@dashboard/Dashboard"));
const Projects = lazy(() => import("@dashboard/Projects"));
const ProjectDetails = lazy(() => import("@dashboard/ProjectDetails"));
const ProjectDeployments = lazy(() => import("@dashboard/ProjectDeployments"));
const ProjectAnalytics = lazy(() => import("@dashboard/ProjectAnalytics"));
const ProjectSettings = lazy(() => import("@dashboard/ProjectSettings"));
const CreateProject = lazy(() => import("@dashboard/CreateProject"));
const Deployments = lazy(() => import("@dashboard/Deployments"));
const Analytics = lazy(() => import("@dashboard/Analytics"));
const Activity = lazy(() => import("@dashboard/Activity"));
const Monitoring = lazy(() => import("@dashboard/Monitoring"));
const Integrations = lazy(() => import("@dashboard/Integrations"));
const Profile = lazy(() => import("@dashboard/Profile"));

// Support Pages
const CLI = lazy(() => import("@support/CLI"));
const APITester = lazy(() => import("@support/APITester"));
const DocsLayout = lazy(() => import("@pages/docs/DocsLayout"));
const DocsOverview = lazy(() => import("@pages/docs/DocsOverview"));
const DocumentPage = lazy(() => import("@pages/docs/DocumentPage"));
const BlogLayout = lazy(() => import("@pages/blog/BlogLayout"));
const BlogOverview = lazy(() => import("@pages/blog/BlogOverview"));
const BlogPostPage = lazy(() => import("@pages/blog/BlogPostPage"));
const SupportCenter = lazy(() => import("@support/SupportCenter"));

// Marketing Pages
const Community = lazy(() => import("@marketing/Community"));

// Legal Pages
const PrivacyPolicy = lazy(() => import("@legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@legal/TermsOfService"));
const CookiePolicy = lazy(() => import("@legal/CookiePolicy"));

// Product Pages
const AIDeployment = lazy(() => import("@products/AIDeployment"));
const CodeAnalysis = lazy(() => import("@products/CodeAnalysis"));
const CloudIntegration = lazy(() => import("@products/CloudIntegration"));
const SecurityShield = lazy(() => import("@products/SecurityShield"));
const DevOpsAutomation = lazy(() => import("@products/DevOpsAutomation"));

// Download Pages
const CLITool = lazy(() => import("@downloads/CLITool"));
const SDK = lazy(() => import("@downloads/SDK"));

// Keep frequently accessed pages non-lazy for better performance
import Home from "@pages/marketing/Home";
import NotFound from "@pages/NotFound";
import { getMe } from "@redux/index";

// Utility pages
const Health = lazy(() => import("@pages/Health"));

// Layout Components
const DashboardLayout = lazy(() =>
  import("@components/layouts/DashboardLayout")
);
const ResourcesLayout = lazy(() =>
  import("@components/layouts/ResourcesLayout")
);
const DownloadsLayout = lazy(() =>
  import("@components/layouts/DownloadsLayout")
);
const ProductsLayout = lazy(() => import("@components/layouts/ProductsLayout"));

/**
 * Main App Component
 * Handles routing, authentication, and lazy loading
 */
function App() {
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

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
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="verify-otp" element={<VerifyOtp />} />
          </Route>

          {/* Main Application Routes */}
          <Route path="/" element={<Layout />}>
            {/* Public Pages */}
            <Route index element={<Home />} />
            <Route path="health" element={<Health />} />

            {/* Legal Pages */}
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />

            {/* Product Pages */}
            <Route path="products" element={<ProductsLayout />}>
              <Route index element={<Navigate to="ai-deployment" replace />} />
              <Route path="ai-deployment" element={<AIDeployment />} />
              <Route path="code-analysis" element={<CodeAnalysis />} />
              <Route path="cloud-integration" element={<CloudIntegration />} />
              <Route path="devops-automation" element={<DevOpsAutomation />} />
              <Route path="security-shield" element={<SecurityShield />} />
            </Route>

            {/* Resources */}
            <Route path="resources" element={<ResourcesLayout />}>
              {/* Documentation */}
              <Route path="docs" element={<DocsLayout />}>
                <Route
                  index
                  element={<Navigate to="getting-started" replace />}
                />
                <Route path=":category" element={<DocsOverview />} />
                <Route path=":category/:slug" element={<DocumentPage />} />
              </Route>

              {/* Blog */}
              <Route path="blogs" element={<BlogLayout />}>
                <Route index element={<BlogOverview />} />
                <Route path=":category" element={<BlogOverview />} />
                <Route path=":category/:slug" element={<BlogPostPage />} />
              </Route>

              {/* Support & Community */}
              <Route path="support" element={<SupportCenter />} />
              <Route path="community" element={<Community />} />
            </Route>

            {/* Downloads */}
            <Route path="downloads" element={<DownloadsLayout />}>
              <Route index element={<Navigate to="cli" replace />} />
              <Route path="cli" element={<CLITool />} />
              <Route path="sdk" element={<SDK />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/create" element={<CreateProject />} />
                <Route path="projects/:id" element={<ProjectDetails />}>
                  <Route path="deployments" element={<ProjectDeployments />} />
                  <Route path="analytics" element={<ProjectAnalytics />} />
                  <Route path="settings" element={<ProjectSettings />} />
                </Route>
                <Route path="deployments" element={<Deployments />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="activity" element={<Activity />} />
                <Route path="cli" element={<CLI />} />
                <Route path="api-tester" element={<APITester />} />
                <Route path="monitoring" element={<Monitoring />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

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
