import {
  useReducer,
  createContext,
  useEffect,
  useContext,
  useRef,
} from "react";
import { INITIAL_PATH, ROUTES } from "./Routes";
import "./Slider.css";

const parsePageKeyFromPath = (path) => {
  const matches = path.match(/\/([^\/\?]+)/);
  if (matches) return matches[1];
  return "";
};

const INITIAL_ROUTER = {
  path: INITIAL_PATH,
  pageKey: parsePageKeyFromPath(INITIAL_PATH),
  prev: [],
  slider: {
    activeSide: "flip",
    flipKey: parsePageKeyFromPath(INITIAL_PATH),
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
      window.history.pushState({}, "", action?.payload?.path);

      return {
        ...state,
        path: action?.payload?.path,
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
    }

    case "push": {
      const futurePageKey = parsePageKeyFromPath(action?.payload?.path);
      if (futurePageKey === state.pageKey) return state;
      window.history.pushState({}, "", action?.payload?.path);

      return {
        ...state,
        path: action?.payload?.path,
        prev: [
          ...state.prev,
          {
            path: state.path,
            direction: action?.payload?.direction,
          },
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
    }

    case "pushNoHistory": {
      const futurePageKey = parsePageKeyFromPath(action?.payload?.path);
      if (futurePageKey === state.pageKey) return state;
      window.history.pushState({}, "", action?.payload?.path);

      return {
        ...state,
        path: action?.payload?.path,
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
    }

    case "pop": {
      const prevState = state.prev[state.prev.length - 1];
      window.history.pushState({}, "", prevState?.path);
      const prevPageKey = parsePageKeyFromPath(prevState?.path);
      const direction =
        action?.payload?.direction ||
        getOppositeDirection(prevState?.direction);

      return {
        ...state,
        path: prevState?.path,
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
    const splits = window.location.href.split("/");
    const path = "/" + splits[splits.length - 1];
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

  const goTo = (path, direction) => {
    dispatch({ type: "pushNoHistory", payload: { path, direction } });
  };

  const goToWithBack = (path, direction) => {
    dispatch({ type: "push", payload: { path, direction } });
  };

  const goBack = (direction) => {
    dispatch({ type: "pop", payload: { direction } });
  };

  return {
    path: router.path,
    slider: { ...router.slider },
    goTo,
    goToWithBack,
    goBack,
    canGoBack,
  };
};

export const EmptyPage = () => <></>;

export const getQueryParams = () => {
  const url = new URL(window.location.href);
  return new URLSearchParams(url.search);
}

export const getLastPathSegment = () => {
  const path = window.location.pathname;
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return "";
  return path.substring(lastSlash + 1);
};
