import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import { Outlet } from "react-router";

export const Layout = ({ children }) => {
  const libraryInfo = useLibraryInfo();
  const auth = useAuth();

  return (
    <div className="flex min-h-full items-stretch justify-center">
      <div className="relative w-full max-w-5xl">
        <h1>{libraryInfo.get.name}</h1>
        <button onClick={() => auth.logout()}>Logout</button>
        {children}
        <Outlet />
      </div>
    </div>
  );
};
