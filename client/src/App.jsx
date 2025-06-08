import { Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react"; // Ensure useState is imported

// Components
import Spinner from "./components/Spinner";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Modal from "./components/Modal";

// Auth Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import DevHealthPage from "./pages/DevHealthPage"; // Import the new health page
import { getMe } from "./redux/slices/authSlice";
import Profile from "./pages/Profile";
import VerifyOtp from "./pages/VerifyOtp";
import Sidebar from "./components/Sidebar";

function App() {
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      return savedMode === "true";
    }
    // If no saved mode, check system preference
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // Effect to apply dark mode class to <html> and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Function to toggle dark mode (you'll pass this to Navbar or a theme context)
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  if (loading.me) {
    return <Spinner fullScreen={true} />;
  }

  return (
    <>
      {/* Pass darkMode and toggleDarkMode to Layout/Navbar if the button is there */}
      {/* For example, if Layout includes Navbar: <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> */}
      {/* Or manage it via Context API for deeper component access */}

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
        {/* Ensure Layout component can receive and use darkMode/toggleDarkMode if Navbar is inside it */}
        <Route
          path="/"
          element={
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        >
          <Route index element={<Home />} />
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="dev/health" element={<DevHealthPage />} />{" "}
          {/* Add route for health page */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Modal />
      <Sidebar/>
    </>
  );
}

export default App;
