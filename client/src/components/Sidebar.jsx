import React, { useEffect, useRef } from "react";
import { useSidebar } from "../context/SidebarContext.jsx";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar, sidebarContent } = useSidebar();
  const sidebarRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // Close on click outside
  const handleOverlayClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      closeSidebar();
    }
  };

  if (!isSidebarOpen) return null;

  return (
    <div
      className="sidebar-overlay"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <aside
        ref={sidebarRef}
        style={{
          background: "#fff",
          minWidth: 300,
          maxWidth: 400,
          height: "100%",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          padding: 24,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {sidebarContent}
      </aside>
    </div>
  );
};

export default Sidebar;
