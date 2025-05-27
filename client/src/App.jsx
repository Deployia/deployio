import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";

// Auth Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { getMe } from "./redux/slices/authSlice";
import Profile from "./pages/Profile";

function App() {
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Global axios configuration for cookies
  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  // Show loading spinner when checking authentication status
  if (loading.me) {
    return <Spinner fullScreen={true} />;
  }

  // Check if current path is an auth page
  const isAuthPage = () => {
    const authPaths = ["/login", "/register", "/forgot-password"];
    const currentPath = window.location.pathname;
    return (
      authPaths.some((path) => currentPath.startsWith(path)) ||
      currentPath.includes("/reset-password")
    );
  };
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 flex flex-col">
      {/* Conditionally render navbar and sidebar only for non-auth pages */}
      {!isAuthPage() && <Navbar />}
      {!isAuthPage() && <Sidebar />}
      <Modal />

      <main
        className={
          isAuthPage() ? "flex-1 overflow-hidden" : "flex-1 overflow-hidden"
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
