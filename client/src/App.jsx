import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

// Components
import Spinner from "./components/Spinner";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Modal from "./components/Modal";
import ScrollToTop from "./components/ScrollToTop";

// Auth Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import VerifyOtp from "./pages/VerifyOtp";
import Health from "./pages/Health";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
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
        </Route>{" "}
      </Routes>
      <Modal />
      <ScrollToTop />
    </>
  );
}

export default App;
