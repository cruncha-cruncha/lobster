import { useReducer, createContext, useEffect, useContext } from "react";

export const INITIAL_ROUTER = {
  path: "",
  prev: [],
  page: "",
};

const RouterContext = createContext(INITIAL_ROUTER);
const RouterDispatchContext = createContext(() => {});

const parsePageFromPath = (path) => {
  const matches = path.match(/\/([^\/\?]+)/);
  if (matches) return matches[1];
  return "";
};

function reducer(state, action) {
  switch (action.type) {
    case "setInitialPath": {
      const page = parsePageFromPath(action?.payload?.path);
      return {
        ...state,
        path: action?.payload?.path,
        prev: [],
        page,
      };
    }
    case "setPath": {
      const page = parsePageFromPath(action?.payload?.path);
      return {
        ...state,
        path: action?.payload?.path,
        prev: [...state.prev, state.path],
        page,
      };
    }
    case "clearHistory":
      return {
        ...state,
        prev: [],
      };
    case "pop": {
      if (state.prev.length === 0) return state;
      const oldPath = state.prev[state.prev.length - 1];
      return {
        ...state,
        path: oldPath,
        prev: state.prev.slice(0, state.prev.length - 1),
        page: parsePageFromPath(oldPath),
      };
    }
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
}

export const Router = ({ children }) => {
  const [router, dispatch] = useReducer(reducer, INITIAL_ROUTER);

  useEffect(() => {
    const splits = window.location.href.split("/");
    const path = "/" + splits[splits.length - 1];
    dispatch({ type: "setInitialPath", payload: { path } });
  }, []);

  return (
    <RouterContext.Provider value={router}>
      <RouterDispatchContext.Provider value={dispatch}>
        {children}
      </RouterDispatchContext.Provider>
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const router = useContext(RouterContext);
  const dispatch = useContext(RouterDispatchContext);
  const canGoBack = router.prev.length > 0;

  const goTo = (path) => {
    dispatch({ type: "setPath", payload: { path } });
    window.history.pushState({}, "", path);
  };

  const clearHistory = () => {
    dispatch({ type: "clearHistory" });
  };

  const goBack = () => {
    dispatch({ type: "pop" });
  };

  return {
    path: router.path,
    page: router.page,
    canGoBack,
    goTo,
    goBack,
    clearHistory,
  };
};
