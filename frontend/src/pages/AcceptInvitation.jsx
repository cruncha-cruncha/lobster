import { useReducer, useState } from "react";
import { validateEmail, validatePassword } from "./Login";
import { CenteredLoadingDots } from "../components/LoadingDots";
import * as endpoints from "../api/endpoints";

export const initialState = {
  code: "",
  name: "",
  email: "",
  password: "",
  language: 0,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "code":
      return { ...state, code: action.payload };
    case "name":
      return { ...state, name: action.payload };
    case "email":
      return { ...state, email: action.payload };
    case "password":
      return { ...state, password: action.payload };
    case "language":
      return { ...state, language: action.payload };
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
};

export const useAcceptInvitation = (props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validEmail = validateEmail(state.email);
  const validPassword = validatePassword(state.password);

  const canAccept =
    state.code &&
    state.name &&
    validEmail &&
    validPassword &&
    state.language &&
    !isLoading;

  const setCode = (e) => {
    dispatch({ type: "code", payload: e.target.value });
  };

  const setFirstName = (e) => {
    dispatch({ type: "name", payload: e.target.value });
  };

  const setEmail = (e) => {
    dispatch({ type: "email", payload: e.target.value });
  };

  const setPassword = (e) => {
    dispatch({ type: "password", payload: e.target.value });
  };

  const setLanguage = (e) => {
    console.log("setLanguage", e.target.value);
    dispatch({ type: "language", payload: e.target.value });
  };

  const onAccept = async (e) => {
    setIsLoading(true);
    await endpoints.acceptInvitation({
      code: state.code,
      name: state.name,
      email: state.email,
      password: state.password,
      language: state.language,
    });
    // TODO: handle error
    setIsLoading(false);
  };

  return {
    ...state,
    showPassword,
    setCode,
    setFirstName,
    setEmail,
    setPassword,
    setLanguage,
    onAccept,
    canAccept,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    isLoading,
  };
};

export const AcceptInvitation = (props) => {
  const acceptInvitation = useAcceptInvitation(props);
  return <PureAcceptInvitation {...acceptInvitation} />;
};

export const PureAcceptInvitation = (acceptInvitation) => {
  return (
    <div className="flex h-full items-center justify-center p-2">
      <div className="flex w-full max-w-sm flex-col justify-center">
        <h1 className="mb-2 text-center text-lg">Accept Invitation</h1>
        <div className="m-2 rounded-sm border-b-2 border-stone-800">
          <input
            id="code"
            type="text"
            className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            placeholder="Code"
            value={acceptInvitation?.code}
            onChange={(e) => acceptInvitation?.setCode?.(e)}
          />
        </div>
        <div className="m-2 mb-1 rounded-sm border-b-2 border-stone-800">
          <input
            id="email"
            type="text"
            className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            placeholder="Email"
            value={acceptInvitation?.email}
            onChange={(e) => acceptInvitation?.setEmail?.(e)}
          />
        </div>
        <p className="mx-2 mb-2 text-sm text-stone-400">
          Your email will never be shown to other users.
        </p>
        <div className="m-2 rounded-sm border-b-2 border-stone-800">
          <input
            id="first-name"
            type="text"
            className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            placeholder="First Name"
            value={acceptInvitation?.name}
            onChange={(e) => acceptInvitation?.setFirstName?.(e)}
          />
        </div>
        <div className="m-2 mb-1 rounded-sm border-b-2 border-stone-800">
          <div className="relative flex items-center rounded-sm ring-sky-500 transition-shadow focus-within:ring-2">
            <input
              id="password"
              type={acceptInvitation?.showPassword ? "text" : "password"}
              className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
              placeholder="Password"
              value={acceptInvitation?.password}
              onChange={(e) => acceptInvitation?.setPassword?.(e)}
            />
            <div
              className="relative cursor-pointer"
              onClick={(e) => acceptInvitation?.toggleShowPassword(e)}
            >
              <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
              <span className="py-1 pl-1 pr-2 text-sm text-stone-400">
                {acceptInvitation?.showPassword ? "hide" : "show"}
              </span>
            </div>
          </div>
        </div>
        <p className="mx-2 mb-2 text-sm text-stone-400">
          Password must be at least 16 characters long.
        </p>
        <select
          className={
            "m-2 rounded-sm border-b-2 border-stone-800 bg-white px-2 py-1" +
            (acceptInvitation?.language != "0" ? "" : " text-stone-400")
          }
          value={acceptInvitation?.language}
          onChange={(e) => acceptInvitation?.setLanguage?.(e)}
        >
          <option value="0" disabled className="placeholder">
            Language
          </option>
          <option value="1">English</option>
          <option value="2">Spanish</option>
          <option value="3">French</option>
        </select>
        <div className="flex justify-center mt-4">
          <button
            className={
              "rounded-full px-6 py-2 transition-colors" +
              (acceptInvitation?.canAccept || acceptInvitation?.isLoading
                ? " bg-emerald-200"
                : " bg-stone-300 text-white") +
              (acceptInvitation?.canAccept
                ? " hover:bg-emerald-900 hover:text-white"
                : "")
            }
            onClick={(e) => acceptInvitation?.onAccept(e)}
            disabled={!acceptInvitation?.canAccept}
          >
            {acceptInvitation?.isLoading && <CenteredLoadingDots />}
            <span className={acceptInvitation?.isLoading ? " invisible" : ""}>
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
