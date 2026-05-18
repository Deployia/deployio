import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import useNotificationToasts from "@hooks/useNotificationToasts";
import { APP_TOAST_STYLE } from "@utils/appToast";

function Layout({ children }) {
  const location = useLocation();
  useNotificationToasts();
  
  // Routes that should NOT have a footer
  const routesWithoutFooter = [
    '/dashboard',
    '/auth',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];
  
  // Check if current route should have footer
  const shouldShowFooter = !routesWithoutFooter.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-black to-neutral-900 body">
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 10000 }}
        toastOptions={{
          duration: 4000,
          style: APP_TOAST_STYLE,
          success: {
            duration: 3500,
            iconTheme: { primary: "#4ade80", secondary: "#171717" },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: "#f87171", secondary: "#171717" },
          },
        }}
      />
      <Navbar />
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full">{children || <Outlet />}</div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}


export default Layout;
