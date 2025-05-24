import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "../components/Spinner";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading && loading.me) {
    return <Spinner />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
