import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { initializeSEOOptimizations } from "./utils/seoOptimizations.js";
import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";

// Initialize SEO optimizations before React renders
initializeSEOOptimizations();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <SidebarProvider>
            <ModalProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "rgba(31, 41, 55, 0.95)",
                    color: "#f9fafb",
                    border: "1px solid rgba(55, 65, 81, 0.5)",
                    borderRadius: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    backdropFilter: "blur(10px)",
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#f9fafb",
                    },
                    style: {
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#f9fafb",
                    },
                    style: {
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: "#3b82f6",
                      secondary: "#f9fafb",
                    },
                    style: {
                      border: "1px solid rgba(59, 130, 246, 0.3)",
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
