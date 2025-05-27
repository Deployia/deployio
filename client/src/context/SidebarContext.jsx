/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState(null);

  const openSidebar = useCallback((content = null) => {
    setSidebarContent(content);
    setSidebarOpen(true);
  }, []);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSidebarContent(null);
  }, []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        sidebarContent,
        openSidebar,
        closeSidebar,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
