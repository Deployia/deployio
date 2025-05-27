import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
