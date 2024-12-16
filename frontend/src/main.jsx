import React from "react";
import ReactDOM from "react-dom/client";
import { UserAuth } from "./components/userAuth";
import { loadCountries } from "./components/useCountries";
import { loadLanguages } from "./components/useLanguages";
import { SetupLibrary } from "./pages/SetupLibrary";
import { Login } from "./pages/Login";
import "./index.css";

const Init = ({ children }) => {
  loadCountries();
  loadCurrencies();
  loadLanguages();

  return children;
};

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <UserAuth>
//       <Init>
//         <Router />
//       </Init>
//     </UserAuth>
//   </React.StrictMode>,
// );

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SetupLibrary />
    <Login />
  </React.StrictMode>,
);
