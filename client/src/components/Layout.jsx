import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
// import Footer from "./Footer";

function Layout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex flex-col body">
      <Navbar />
      <Sidebar />
      <main className="flex-1 overflow-hidden body">
        {children || <Outlet />}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default Layout;
