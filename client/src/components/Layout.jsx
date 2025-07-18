import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children }) {
  const location = useLocation();
  
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
