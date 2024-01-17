import {
  useReducer,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import * as endpoints from "../api/endpoints";

const INITIAL_USER = {
  userId: null,
  claimsLevel: 0,
};

const UserContext = createContext(INITIAL_USER);
const UserDispatchContext = createContext(() => {});

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return {
        ...state,
        userId: action?.payload?.userId,
        claimsLevel: action?.payload?.claimsLevel,
      };
    case "logout":
      return INITIAL_USER;
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
}

export const UserAuth = ({ children }) => {
  const [user, dispatch] = useReducer(reducer, INITIAL_USER);
  usePersistAccessToken(dispatch);

  const logout = () => {
    dispatch?.({ type: "logout" });
    localStorage?.setItem?.("accessToken", "");
    localStorage?.setItem?.("refreshToken", "");
  };

  useEffect(() => {
    const signIn = () => {
      const refreshToken = localStorage?.getItem?.("refreshToken") || "";
      if (!refreshToken) return;

      endpoints
        .refreshAccessToken({
          refreshToken,
        })
        .then(res => {
          if (res.status !== 200) {
            logout();
          } else {
            dispatch?.({ type: "login", payload: { userId: res.data.user_id, claimsLevel: res.data.claims_level } });
            localStorage?.setItem?.("accessToken", res.data.access_token);
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          window?.dispatchEvent?.(new Event("NEW_LOBSTER_ACCESS_TOKEN"));
        });
    };

    signIn();

    const intervalId = setInterval?.(signIn, 1000 * 60 * 15); // 15 minutes

    return () => {
      clearInterval?.(intervalId);
    };
  }, []);

  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  );
};

const usePersistAccessToken = (dispatch) => {

  const logout = () => {
    dispatch?.({ type: "logout" });
    localStorage?.setItem?.("accessToken", "");
    localStorage?.setItem?.("refreshToken", "");
  };

  useEffect(() => {
    const signIn = () => {
      const refreshToken = localStorage?.getItem?.("refreshToken") || "";
      if (!refreshToken) return;

      // TODO: try again if it fails the first time? Yes, with exponential backoff, and jitter.
      // if we get a response saying the token is expired, then delete the token and don't try again
    
      endpoints
        .refreshAccessToken({
          refreshToken,
        })
        .then(res => {
          if (res.status !== 200) {
            logout();
          } else {
            dispatch?.({ type: "login", payload: { userId: res.data.user_id, claimsLevel: res.data.claims_level } });
            localStorage?.setItem?.("accessToken", res.data.access_token);
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          window?.dispatchEvent?.(new Event("NEW_LOBSTER_ACCESS_TOKEN"));
        });
    };

    signIn();

    const intervalId = setInterval?.(signIn, 1000 * 60 * 15); // 15 minutes

    return () => {
      clearInterval?.(intervalId);
    };
  }, []);
};

export const useAuth = () => {
  const user = useContext(UserContext);
  const dispatch = useContext(UserDispatchContext);
  let [accessToken, setAccessToken] = useState(
    localStorage?.getItem?.("accessToken") || "",
  );

  const isLoggedIn = user.userId && user.claimsLevel && !!accessToken;

  useEffect(() => {
    let mounted = true;

    const listener = () => {
      mounted && setAccessToken(localStorage?.getItem?.("accessToken") || "");
    };

    window?.addEventListener?.("NEW_LOBSTER_ACCESS_TOKEN", listener);

    return () => {
      window?.removeEventListener?.("NEW_LOBSTER_ACCESS_TOKEN", listener);
      mounted = false;
    };
  }, []);

  const login = ({ userId, claimsLevel, accessToken, refreshToken }) => {
    dispatch?.({ type: "login", payload: { userId, claimsLevel } });
    localStorage?.setItem?.("accessToken", accessToken);
    localStorage?.setItem?.("refreshToken", refreshToken);
    window?.dispatchEvent?.(new Event("NEW_LOBSTER_ACCESS_TOKEN"));
  };

  const logout = () => {
    dispatch?.({ type: "logout" });
    localStorage?.setItem?.("accessToken", "");
    localStorage?.setItem?.("refreshToken", "");
    window?.dispatchEvent?.(new Event("NEW_LOBSTER_ACCESS_TOKEN"));
  };

  return {
    user,
    accessToken,
    login,
    logout,
    isLoggedIn,
  };
};
