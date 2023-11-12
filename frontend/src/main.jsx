import React from "react";
import ReactDOM from "react-dom/client";
import { UserAuth } from "./components/userAuth";
import { Router } from "./components/Router/Router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserAuth>
      <Router />
    </UserAuth>
  </React.StrictMode>,
);
