import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext.jsx";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar, sidebarContent } = useSidebar();
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);
  const sidebarRef = useRef(null);

  // Mount/unmount logic for animation
  useEffect(() => {
    if (isSidebarOpen) {
      setShouldRender(true);
      setAnimate(false); // Reset animate to false before triggering
      // Start animation on next animation frame
      requestAnimationFrame(() => setAnimate(true));
    } else if (shouldRender) {
      setAnimate(false);
      // Wait for animation out before unmounting
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isSidebarOpen, shouldRender]);

  // Close on Escape key
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // Touch events for swipe-to-close
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchCurrentX, setTouchCurrentX] = useState(null);
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchCurrentX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (
      touchStartX !== null &&
      touchCurrentX !== null &&
      touchStartX - touchCurrentX > 80
    ) {
      closeSidebar();
    }
    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  // Close on click outside
  const handleOverlayClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      closeSidebar();
    }
  };

  if (!shouldRender) return null;
  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-stretch bg-black/60 backdrop-blur-sm transition-opacity duration-300 body ${
        animate ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      <aside
        ref={sidebarRef}
        className={`ml-auto h-full w-[90vw] max-w-sm bg-neutral-900 border-l border-neutral-700 p-6 overflow-y-auto transform transition-transform duration-300 ${
          animate ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="text-white body">{sidebarContent}</div>
      </aside>
    </div>
  );
};

export default Sidebar;
