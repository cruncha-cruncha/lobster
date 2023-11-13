import { useReducer, useState } from "react";
import { validateEmail, validatePassword } from "./Login";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import { useRouter } from "../components/router/Router";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
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
    case "email":
      return { ...state, email: action.payload };
    case "password":
      return { ...state, password: action.payload };
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
};

export const useResetPassword = () => {
  const modal = useInfoModal();
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validEmail = validateEmail(state.email);
  const validPassword = validatePassword(state.password);

  const canReset = state.code && validEmail && validPassword && !isLoading;

  const setCode = (e) => {
    dispatch({ type: "code", payload: e.target.value });
  };

  const setEmail = (e) => {
    dispatch({ type: "email", payload: e.target.value });
  };

  const setPassword = (e) => {
    dispatch({ type: "password", payload: e.target.value });
  };

  const onReset = async (e) => {
    setIsLoading(true);

    const showErrModal = () => {
      modal.open("Request failed. Please check your credentials and try again later, or recover again.", "error")
    };

    endpoints
      .resetPassword({
        code: state.code,
        email: state.email,
        password: state.password,
      })
      .then((data) => {
        if (!data) {
          showErrModal();
        } else {
          router.goTo("/login", "left")
        }
      }, showErrModal)
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    ...state,
    showPassword,
    setCode,
    setEmail,
    setPassword,
    onReset,
    canReset,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    isLoading,
    modal,
  };
};

export const ResetPassword = (props) => {
  const resetPassword = useResetPassword(props);
  return <PureResetPassword {...resetPassword} />;
};

export const PureResetPassword = (resetPassword) => {
  return (
    <>
      <PureInfoModal {...resetPassword?.modal} />
      <div className="flex h-full items-center justify-center">
        <div className="flex w-full max-w-sm flex-col justify-center">
          <h1 className="mb-2 text-center text-lg">Reset Password</h1>
          <div className="m-2 rounded-sm border-b-2 border-stone-800">
            <input
              id="code"
              type="text"
              className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
              placeholder="Code"
              value={resetPassword?.code}
              onChange={(e) => resetPassword?.setCode?.(e)}
            />
          </div>
          <div className="m-2 rounded-sm border-b-2 border-stone-800">
            <input
              id="email"
              type="text"
              className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
              placeholder="Email"
              value={resetPassword?.email}
              onChange={(e) => resetPassword?.setEmail?.(e)}
            />
          </div>
          <div className="m-2 mb-1 rounded-sm border-b-2 border-stone-800">
            <div className="relative flex items-center ring-sky-500 transition-shadow focus-within:ring-2">
              <input
                id="password"
                type={resetPassword?.showPassword ? "text" : "password"}
                className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
                placeholder="Password"
                value={resetPassword?.password}
                onChange={(e) => resetPassword?.setPassword?.(e)}
              />
              <div
                className="relative cursor-pointer"
                onClick={(e) => resetPassword?.toggleShowPassword?.(e)}
              >
                <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
                <span className="rounded-r-lg bg-white py-1 pl-1 pr-2 text-sm text-stone-400">
                  {resetPassword?.showPassword ? "hide" : "show"}
                </span>
              </div>
            </div>
          </div>
          <p className="mx-2 mb-2 text-sm text-stone-400">
            Password must be at least 16 characters long.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              className={
                "rounded-full px-6 py-2 transition-colors" +
                (resetPassword?.canReset || resetPassword?.isLoading
                  ? " bg-emerald-200"
                  : " bg-stone-300 text-white") +
                (resetPassword?.canReset
                  ? " hover:bg-emerald-900 hover:text-white"
                  : "")
              }
              onClick={(e) => resetPassword?.onReset?.(e)}
              disabled={!resetPassword?.canReset}
            >
              {resetPassword?.isLoading && <CenteredLoadingDots />}
              <span className={resetPassword?.isLoading ? " invisible" : ""}>
                Reset
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
