import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import Spinner from "@components/Spinner";

const ProtectedRoute = ({ admin = false }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading && loading.me) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    // Store the current path for redirect after login
    const currentPath = location.pathname + location.search;
    const encodedPath = encodeURIComponent(currentPath);
    return <Navigate to={`/auth/login?next=${encodedPath}`} replace />;
  }

  if (admin && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  admin: PropTypes.bool,
};

export default ProtectedRoute;
