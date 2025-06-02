import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
// import Footer from "./Footer";

function Layout({ children, darkMode, toggleDarkMode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[rgb(var(--bg-primary))] flex flex-col">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        {children || <Outlet />}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default Layout;
