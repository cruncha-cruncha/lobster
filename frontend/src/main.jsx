import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
// import { UserAuth } from "./state/auth";
import { loadCountries } from "./components/useCountries";
import { loadLanguages } from "./components/useLanguages";
import { SetupLibrary } from "./pages/SetupLibrary";
import { Login } from "./pages/Login";
import * as endpoints from "./api/endpoints";
import "./index.css";
import { LoadingScreen } from "./components/loading/LoadingScreen";
import { useLibraryInfo } from "./state/libraryInfo";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToolSearch } from "./pages/ToolSearch";
import { useSetupAuth } from "./state/auth";

const Init = ({ children }) => {
  const libraryInfo = useLibraryInfo();
  useSetupAuth();

  if (libraryInfo.get.name) {
    return children;
  } else if (libraryInfo.error) {
    if (libraryInfo.error.message === "404") {
      return <SetupLibrary />;
    } else {
      return (
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-2 flex w-full max-w-sm flex-col justify-center">
            <p className="text-center">
              Error: "{libraryInfo.error.message}", while attempting to fetch
              information about the library.
            </p>
          </div>
        </div>
      );
    }
  } else {
    return <LoadingScreen />;
  }
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
    <BrowserRouter>
      <Init>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tools" element={<ToolSearch />} />
          {/* <Route path="dashboard" element={<Dashboard />}>
        <Route index element={<RecentActivity />} />
        <Route path="project/:id" element={<Project />} />
      </Route> */}
        </Routes>
      </Init>
    </BrowserRouter>
  </React.StrictMode>,
);
