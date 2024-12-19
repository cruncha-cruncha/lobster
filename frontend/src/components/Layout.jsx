import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";

export const Layout = () => {
  const libraryInfo = useLibraryInfo();
  const auth = useAuth({ mustBeLoggedIn: true });
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex min-h-full items-stretch justify-center">
      <div className="relative w-full max-w-5xl p-2">
        <div className="flex justify-between">
          <h1>{libraryInfo.name}</h1>
          <div
            className="relative"
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <span className="cursor-pointer">menu</span>
            <div
              className={
                "flex flex-col items-end bg-white px-2 [&>*]:my-1" +
                (showMenu ? " absolute -right-2" : " hidden")
              }
            >
              <NavLink to="/people" className="!mt-2">
                People
              </NavLink>
              <NavLink to="/grievances">Grievances</NavLink>
              <NavLink to="/rentals">Rentals</NavLink>
              <NavLink to="/tools">Tools</NavLink>
              <NavLink to="/stores">Stores</NavLink>
              <NavLink to="/library">Library</NavLink>
              <button onClick={() => auth.logout()} className="block">
                Logout
              </button>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
