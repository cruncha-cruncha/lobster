import React from "react";
import ReactDOM from "react-dom/client";
import { UserAuth } from "./components/userAuth";
import { Router } from "./components/router/Router";
import { loadCountries } from "./components/useCountries";
import { loadCurrencies } from "./components/useCurrencies";
import { loadLanguages } from "./components/useLanguages";
import "./index.css";

const Init = ({ children }) => {
  loadCountries();
  loadCurrencies();
  loadLanguages();

  return children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserAuth>
      <Init>
        <Router />
      </Init>
    </UserAuth>
  </React.StrictMode>,
);
