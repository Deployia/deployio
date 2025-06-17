import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import Spinner from "@components/Spinner";

const ProtectedRoute = ({ admin = false }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  if (loading && loading.me) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  if (admin && user?.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  admin: PropTypes.bool,
};

export default ProtectedRoute;
