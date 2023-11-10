import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { UserAuth } from "./components/userAuth";
import { Router } from "./components/Router/Router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <Router className="relative">
        <UserAuth className="relative">
          <App />
        </UserAuth>
      </Router>
  </React.StrictMode>,
);
