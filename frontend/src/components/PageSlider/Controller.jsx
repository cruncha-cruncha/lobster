import { useRef, useReducer } from "react";
import { PageA } from "./PageA";
import { PageB } from "./PageB";
import { PageC } from "./PageC";
// import { ROUTES } from "../Router/Routes";
import "./Controller.css";

const ROUTES = {
  a: PageA,
  b: PageB,
  c: PageC,
};

const initialState = {
  activeSide: "flip",
  activeKey: "a",
  flipKey: "a",
  flopKey: "",
  inTransition: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "set":
      if (state.activeSide === "flip") {
        return {
          ...state,
          activeKey: action.payload,
          flipKey: action.payload,
          flopKey: "",
          inTransition: false,
        };
      } else {
        return {
          ...state,
          activeKey: action.payload,
          flipKey: "",
          flopKey: action.payload,
          inTransition: false,
        };
      }
    case "arriving":
      if (state.activeSide === "flip") {
        return {
          ...state,
          flopKey: action.payload,
          inTransition: true,
        };
      } else {
        return {
          ...state,
          flipKey: action.payload,
          inTransition: true,
        };
      }
    case "doneTransition":
      const newActiveSide = state.activeSide === "flip" ? "flop" : "flip";
      return {
        ...state,
        activeSide: newActiveSide,
        activeKey: newActiveSide === "flip" ? state.flipKey : state.flopKey,
        inTransition: false,
      };
    default:
      console.error("Unknown action type:", action.type);
      return { ...state };
  }
};

export const Controller = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const animationRef = useRef();

  const scheduleDoneTransition = () => {
    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "show-flop" : "show-flip";
      dispatch({ type: "doneTransition" });
    }, 401);
  };

  const slideDown = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-down-reverse" : "slide-down";
    }, 0);

    scheduleDoneTransition();
  };

  const slideUp = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-up" : "slide-up-reverse";
    }, 0);

    scheduleDoneTransition();
  };

  const slideRight = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-right-reverse" : "slide-right";
    }, 0);

    scheduleDoneTransition();
  };

  const slideLeft = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-left" : "slide-left-reverse";
    }, 0);

    scheduleDoneTransition();
  };

  const slideBack = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-back" : "slide-back-reverse";
    }, 0);

    scheduleDoneTransition();
  };

  const slideForward = (key) => {
    if (state.inTransition || state.activeKey === key) return;

    dispatch({ type: "arriving", payload: key });

    setTimeout(() => {
      animationRef.current.className =
        state.activeSide === "flip" ? "slide-forward" : "slide-forward-reverse";
    }, 0);

    scheduleDoneTransition();
  };

  const goLeft = () => {
    switch (state.activeKey) {
      case "a":
        slideLeft("b");
        break;
      case "b":
        slideLeft("c");
        break;
      case "c":
        slideLeft("a");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const goRight = () => {
    switch (state.activeKey) {
      case "a":
        slideRight("c");
        break;
      case "b":
        slideRight("a");
        break;
      case "c":
        slideRight("b");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const goDown = () => {
    switch (state.activeKey) {
      case "a":
        slideDown("c");
        break;
      case "b":
        slideDown("a");
        break;
      case "c":
        slideDown("b");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const goUp = () => {
    switch (state.activeKey) {
      case "a":
        slideUp("b");
        break;
      case "b":
        slideUp("c");
        break;
      case "c":
        slideUp("a");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const goBack = () => {
    switch (state.activeKey) {
      case "a":
        slideBack("c");
        break;
      case "b":
        slideBack("a");
        break;
      case "c":
        slideBack("b");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const goForward = () => {
    switch (state.activeKey) {
      case "a":
        slideForward("b");
        break;
      case "b":
        slideForward("c");
        break;
      case "c":
        slideForward("a");
        break;
      default:
        console.error("Unknown key:", state.activeKey);
    }
  };

  const Flip = state.flipKey in ROUTES ? ROUTES[state.flipKey] : EmptyPage;
  const Flop = state.flopKey in ROUTES ? ROUTES[state.flopKey] : EmptyPage;

  return (
    <div className={"h-screen w-screen overflow-hidden"}>
      <div ref={animationRef}>
        <div className="flip-container">
          <Flip />
        </div>
        <div className="flop-container">
          <Flop />
        </div>
      </div>
      <div className="absolute bottom-0 right-0">
        <span onClick={goLeft}>Left</span>
        <span> </span>
        <span onClick={goRight}>Right</span>
        <span> </span>
        <span onClick={goDown}>Down</span>
        <span> </span>
        <span onClick={goUp}>Up</span>
        <span> </span>
        <span onClick={goBack}>Back</span>
        <span> </span>
        <span onClick={goForward}>Forward</span>
      </div>
    </div>
  );
};

export const EmptyPage = () => <></>;
