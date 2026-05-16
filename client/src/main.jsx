import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { initializeSEOOptimizations } from "@utils/seoOptimizations.js";
import { installChunkReloadRecovery } from "@utils/chunkReloadRecovery.js";
import "./index.css";
import App from "./App.jsx";
import { store } from "@redux/store";
import { SidebarProvider } from "@context/SidebarContext.jsx";
import { ModalProvider } from "@context/ModalContext.jsx";
import PerformanceMonitor from "@components/PerformanceMonitor.jsx";

initializeSEOOptimizations();
installChunkReloadRecovery();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <SidebarProvider>
            <ModalProvider>
              <PerformanceMonitor />
              <App />
            </ModalProvider>
          </SidebarProvider>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </StrictMode>
);
