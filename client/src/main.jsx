import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { initializeSEOOptimizations } from "@utils/seoOptimizations.js";
import "./index.css";
import App from "./App.jsx";
import { store } from "@redux/store";
import { SidebarProvider } from "@context/SidebarContext.jsx";
import { ModalProvider } from "@context/ModalContext.jsx";
import PerformanceMonitor from "@components/PerformanceMonitor.jsx";

// Initialize SEO optimizations before React renders
initializeSEOOptimizations();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <SidebarProvider>
            <ModalProvider>
              <PerformanceMonitor />
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "rgba(31, 41, 55, 0.95)",
                    color: "#fff",
                    border: "1px rgba(75, 85, 99, 0.3)",
                    backdropFilter: "blur(10px)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </ModalProvider>
          </SidebarProvider>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </StrictMode>
);
