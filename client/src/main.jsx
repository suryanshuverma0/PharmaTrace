import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WalletModalProvider } from "./context/WalletModalContext.jsx";
import { BrowserRouter as Router } from "react-router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </AuthProvider>
    </Router>
  </StrictMode>
);
