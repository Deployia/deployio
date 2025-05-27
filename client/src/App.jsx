import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import axios from "axios";

// Components
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";

// Auth Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import { getMe } from "./redux/slices/authSlice";

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

  return (
    <div className="min-h-screen h-screen max-h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-grow h-full max-h-full overflow-hidden">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/update-password" element={<UpdatePassword />} />
          </Route>

          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
