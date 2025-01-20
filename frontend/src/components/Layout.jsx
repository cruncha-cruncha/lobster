import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import { useLayoutInfoModal } from "../state/layoutInfoModal";
import { PureInfoModal } from "./InfoModal";

export const Layout = () => {
  const libraryInfo = useLibraryInfo();
  const auth = useAuth({ mustBeLoggedIn: true });
  const [showMenu, setShowMenu] = useState(false);
  const modal = useLayoutInfoModal();

  const closeMenuIfOpen = () => {
    if (showMenu) {
      setShowMenu(false);
    }
  };

  return (
    <div className="min-h-full" onClick={closeMenuIfOpen}>
      <PureInfoModal {...modal} />
      <div className="relative w-full pb-0 pt-2">
        <div
          className="relative cursor-pointer text-center"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          <p>{libraryInfo.name}</p>
          <div
            className={
              "z-30 w-full bg-white" + (showMenu ? " absolute" : " hidden")
            }
          >
            <div className="mt-2 w-full border-y border-black pb-2 text-left transition-colors">
              <div className="flex items-stretch justify-center">
                <div className="relative w-full max-w-5xl *:my-1 *:block *:px-2 *:duration-150 hover:*:bg-blue-900 hover:*:text-white">
                  <NavLink to="/people" className="!mt-2 hover:bg-blue-900">
                    People
                  </NavLink>
                  <NavLink to="/grievances">Grievances</NavLink>
                  <NavLink to="/rentals">Rentals</NavLink>
                  <NavLink to="/tools">Tools</NavLink>
                  <NavLink to="/stores">Stores</NavLink>
                  <NavLink to="/library">Library</NavLink>
                  <button
                    onClick={() => auth.logout()}
                    className="block w-full text-left hover:!bg-transparent hover:!text-black"
                  >
                    - logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-stretch justify-center">
        <div className="relative w-full max-w-5xl pb-2 pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
