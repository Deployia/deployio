import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SidebarProvider>
          <ModalProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </ModalProvider>
        </SidebarProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
