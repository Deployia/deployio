import { Route, Navigate } from "react-router-dom";
import { lazy, Fragment } from "react";
const AuthLayout = lazy(() => import("@components/auth/Layout"));
const Login = lazy(() => import("@auth/Login"));
const Register = lazy(() => import("@auth/Register"));
const ForgotPassword = lazy(() => import("@auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@auth/ResetPassword"));
const VerifyOtp = lazy(() => import("@auth/VerifyOtp"));

export default function AuthRoutes() {
  return (
    <Fragment>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
      </Route>
    </Fragment>
  );
}
