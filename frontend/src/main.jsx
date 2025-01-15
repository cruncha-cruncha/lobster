import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { SetupLibrary } from "./pages/SetupLibrary";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { LoadingScreen } from "./components/loading/LoadingScreen";
import { useLibraryInfo } from "./state/libraryInfo";
import { Tools } from "./pages/Tools";
import { People } from "./pages/People";
import { Person } from "./pages/Person";
import { Grievances } from "./pages/Grievances";
import { NewGrievance } from "./pages/NewGrievance";
import { Grievance } from "./pages/Grievance";
import { Rentals } from "./pages/Rentals";
import { Cart } from "./pages/Cart";
import { Stores } from "./pages/Stores";
import { Store } from "./pages/Store";
import { NewStore } from "./pages/NewStore";
import { Library } from "./pages/Library";
import { Tool } from "./pages/Tool";
import { Rental } from "./pages/Rental";
import { StoreCart } from "./pages/StoreCart";
import { useSetupAuth } from "./state/auth";
import { useInitConstants } from "./state/constants";
import { useInitToolCategories } from "./state/toolCategories";
import "./index.css";

const Init = ({ children }) => {
  const libraryInfo = useLibraryInfo();
  useInitConstants();
  useInitToolCategories();
  useSetupAuth();

  if (libraryInfo.name) {
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Init>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<Person />} />
            <Route path="/grievances" element={<Grievances />} />
            <Route path="/grievances/new" element={<NewGrievance />} />
            <Route path="/grievances/:id" element={<Grievance />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="rentals/:id" element={<Rental />} />
            <Route path="/cart" element={<Cart />} />
            <Route index element={<Tools />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/:id" element={<Tool />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/stores/new" element={<NewStore />} />
            <Route path="/stores/:id" element={<Store />} />
            <Route path="/stores/:id/cart" element={<StoreCart />} />
            <Route path="/library" element={<Library />} />
          </Route>
        </Routes>
      </Init>
    </BrowserRouter>
  </React.StrictMode>,
);
