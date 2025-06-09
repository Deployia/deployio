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

// Keep frequently accessed pages non-lazy
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { getMe } from "./redux/slices/authSlice";

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
          </Route>
          {/* Main Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="health" element={<Health />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
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
