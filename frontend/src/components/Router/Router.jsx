import {
  useReducer,
  createContext,
  useEffect,
  useContext,
  useRef,
} from "react";
import { ROUTES } from "./Routes";
import "./Transition.css";

const parsePageKeyFromPath = (path) => {
  const matches = (path || "").match(/\/([^\/\?]+)/);
  if (matches) return matches[1];
  return "";
};

const INITIAL_ROUTER = {
  pageKey: "",
  prev: [],
  slider: {
    activeSide: "flip",
    flipKey: "",
    flopKey: "",
    inTransition: false,
    direction: "",
  },
};

const RouterContext = createContext(INITIAL_ROUTER);
const RouterDispatchContext = createContext(() => {});

const getOppositeDirection = (direction) => {
  switch (direction) {
    case "left":
      return "right";
    case "right":
      return "left";
    case "up":
      return "down";
    case "down":
      return "up";
    case "forward":
      return "back";
    case "back":
      return "forward";
    default:
      console.error("uncaught direction ", direction);
      return "";
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case "set": {
      const newPageKey = parsePageKeyFromPath(action?.payload?.path);
      if (newPageKey === state.pageKey) return state;

      const out = {
        ...state,
        pageKey: newPageKey,
        slider: {
          ...state.slider,
          activeSide: "flip",
          flipKey: newPageKey,
          flopKey: "",
          inTransition: false,
          direction: "",
        },
      };

      return out;
    }

    case "push": {
      const futurePageKey = parsePageKeyFromPath(action?.payload?.newPath);
      if (futurePageKey === state.pageKey) return state;

      const out = {
        ...state,
        prev: [
          ...state.prev,
          ...(!action?.payload?.noHistory
            ? [
                {
                  path: action?.payload?.currentPath,
                  direction: action?.payload?.direction,
                },
              ]
            : []),
        ],
        slider: {
          ...state.slider,
          flipKey:
            state.slider.activeSide === "flip"
              ? state.slider.flipKey
              : futurePageKey,
          flopKey:
            state.slider.activeSide === "flip"
              ? futurePageKey
              : state.slider.flopKey,
          direction: action?.payload?.direction,
        },
      };

      return out;
    }

    case "pop": {
      const prevState = state.prev[state.prev.length - 1];
      const prevPageKey = parsePageKeyFromPath(prevState?.path);
      const direction =
        action?.payload?.direction ||
        getOppositeDirection(prevState?.direction);

      const out = {
        ...state,
        prev: state.prev.slice(0, state.prev.length - 1),
        slider: {
          ...state.slider,
          flipKey:
            state.slider.activeSide === "flip"
              ? state.slider.flipKey
              : prevPageKey,
          flopKey:
            state.slider.activeSide === "flip"
              ? prevPageKey
              : state.slider.flopKey,
          direction,
        },
      };

      return out;
    }

    case "startTransition": {
      return {
        ...state,
        slider: {
          ...state.slider,
          inTransition: true,
        },
      };
    }

    case "doneTransition": {
      const newActiveSide =
        state.slider.activeSide === "flip" ? "flop" : "flip";

      return {
        ...state,
        pageKey:
          newActiveSide === "flip"
            ? state.slider.flipKey
            : state.slider.flopKey,
        slider: {
          ...state.slider,
          activeSide: newActiveSide,
          inTransition: false,
          direction: "",
        },
      };
    }

    default:
      console.error("uncaught reduce ", action);
      return state;
  }
};

export const Router = () => {
  const [router, dispatch] = useReducer(reducer, INITIAL_ROUTER);
  const animationRef = useRef();

  useEffect(() => {
    const path = getCurrentFullPath();
    window.history.pushState({}, "", path);
    dispatch({ type: "set", payload: { path } });
  }, []);

  const slideX = (go) => () => {
    if (router.slider.inTransition) return;

    dispatch({ type: "startTransition" });

    setTimeout(go, 0);

    setTimeout(() => {
      animationRef.current.className =
        router.slider.activeSide === "flip" ? "show-flop" : "show-flip";
      dispatch({ type: "doneTransition" });
    }, 401);
  };

  const slideDown = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip" ? "slide-down-reverse" : "slide-down";
  });

  const slideUp = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip" ? "slide-up" : "slide-up-reverse";
  });

  const slideRight = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip"
        ? "slide-right-reverse"
        : "slide-right";
  });

  const slideLeft = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip" ? "slide-left" : "slide-left-reverse";
  });

  const slideBack = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip" ? "slide-back" : "slide-back-reverse";
  });

  const slideForward = slideX(() => {
    animationRef.current.className =
      router.slider.activeSide === "flip"
        ? "slide-forward"
        : "slide-forward-reverse";
  });

  useEffect(() => {
    switch (router.slider.direction) {
      case "left":
        slideLeft();
        break;
      case "right":
        slideRight();
        break;
      case "up":
        slideUp();
        break;
      case "down":
        slideDown();
        break;
      case "forward":
        slideForward();
        break;
      case "back":
        slideBack();
        break;
      default:
        break;
    }
  }, [router.slider.direction]);

  const Flip =
    router.slider.flipKey in ROUTES ? ROUTES[router.slider.flipKey] : EmptyPage;
  const Flop =
    router.slider.flopKey in ROUTES ? ROUTES[router.slider.flopKey] : EmptyPage;

  return (
    <RouterContext.Provider value={router}>
      <RouterDispatchContext.Provider value={dispatch}>
        <div
          className={
            "h-screen w-screen overflow-hidden" +
            (router.slider.direction ? " sliding" : "")
          }
        >
          <div ref={animationRef}>
            <div className="flip-container">
              <Flip />
            </div>
            <div className="flop-container">
              <Flop />
            </div>
          </div>
        </div>
      </RouterDispatchContext.Provider>
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const router = useContext(RouterContext);
  const dispatch = useContext(RouterDispatchContext);
  const canGoBack = !router.slider.inTransition && router.prev.length > 0;

  const goTo = (path, direction, noHistory = false) => {
    const currentPath = getCurrentFullPath();
    window.history.pushState({}, "", path);
    dispatch({
      type: "push",
      payload: {
        currentPath,
        newPath: path,
        direction,
        noHistory,
      },
    });
  };

  const goBack = (direction = "") => {
    const prevState = router.prev[router.prev.length - 1];
    if (!prevState) return;
    window.history.pushState({}, "", prevState?.path);
    dispatch({ type: "pop", payload: { direction } });
  };

  return {
    slider: { ...router.slider },
    pageKey: router.pageKey,
    prevPage: parsePageKeyFromPath(router.prev[router.prev.length - 1]?.path),
    goTo,
    goBack,
    canGoBack,
  };
};

export const EmptyPage = () => <></>;

export const getQueryParams = () => {
  const url = new URL(window.location.href);
  return new URLSearchParams(url.search);
};

export const getLastPathSegment = () => {
  const path = window.location.pathname;
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return "";
  return path.substring(lastSlash + 1);
};

export const getPageKeyFromWindow = () => {
  const path = window.location.pathname;
  return parsePageKeyFromPath(path);
};

export const getCurrentFullPath = () => {
  return `${
    window.location.pathname + window.location.search + window.location.hash
  }`;
};
