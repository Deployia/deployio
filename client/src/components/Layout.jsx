import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, darkMode, toggleDarkMode }) {
  return (
    <div className="h-screen w-screen bg-[rgb(var(--bg-primary))] flex flex-col overflow-x-hidden">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main className="flex-1">{children || <Outlet />}</main>
      <Footer />
    </div>
  );
}

export default Layout;
