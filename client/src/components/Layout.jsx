import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-black to-neutral-900 body">
      <Navbar />
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {children || <Outlet />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
