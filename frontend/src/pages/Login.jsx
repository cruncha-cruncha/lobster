import { useState } from "react";
import { CenteredLoadingDots } from "../components/LoadingDots";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

export const validateEmail = (email) => {
  return new RegExp(/^.+@.+\..+$/).test(email);
};

export const validatePassword = (password) => {
  return password.length > 16;
};

export const useLogin = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [email, _setEmail] = useState("");
  const [password, _setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState("");
  const auth = useAuth();

  const validEmail = validateEmail(email);
  const validPassword = validatePassword(password);

  const onLogin = async () => {
    setIsLoading("login");
    endpoints
      .login({ email, password })
      .then((data) => {
        auth.login({
          userId: data.user_id,
          claimsLevel: data.claims_level,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
      })
      .catch(() => {
        setModalText("Incorrent email or password.");
        setShowModal(true);
      })
      .finally(() => {
        setIsLoading("");
      });
  };

  const onSignUp = async () => {
    setIsLoading("signUp");

    const showErrModal = () => {
      setModalText(
        "Request failed. There may already be a user with this email address.",
      );
      setShowModal(true);
    };

    endpoints
      .requestInvitation({ email })
      .then((data) => {
        if (!data) {
          showErrModal();
        } else {
          setModalText(
            "Request successful. You will receive an email when your account is ready.",
          );
          setShowModal(true);
        }
      }, showErrModal)
      .finally(() => {
        setIsLoading("");
      });
  };

  const onRecover = async () => {
    setIsLoading("recover");

    const showErrModal = () => {
      setModalText(
        "Request failed. There may not be a user with this email address.",
      );
      setShowModal(true);
    };

    endpoints
      .requestPasswordReset({ email })
      .then((data) => {
        if (!data) {
          showErrModal();
        } else {
          setModalText(
            "Request successful. You will receive an email with a link to reset your password.",
          );
          setShowModal(true);
        }
      }, showErrModal)
      .finally(() => {
        setIsLoading("");
      });
  };

  const setEmail = (e) => {
    _setEmail(e.target.value);
  };

  const setPassword = (e) => {
    _setPassword(e.target.value);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    canLogin: validEmail && validPassword && !isLoading,
    canSignUp: validEmail && !password && !isLoading,
    canRecover: validEmail && !isLoading,
    modalText,
    showModal,
    closeModal: () => setShowModal(false),
    onLogin,
    onSignUp,
    onRecover,
    loginLoading: isLoading === "login",
    signUpLoading: isLoading === "signUp",
    recoverLoading: isLoading === "recover",
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
  };
};

export const Login = (props) => {
  const login = useLogin(props);
  return <PureLogin {...login} />;
};

export const PureLogin = (login) => {
  return (
    <>
      {login?.showModal && (
        <PureLoginModal text={login?.modalText} onClose={login?.closeModal} />
      )}
      <div className="flex h-full items-center justify-center">
        <div className="flex w-full max-w-sm flex-col justify-center">
          <h1 className="mb-2 text-center text-xl">Lobster</h1>
          <div className="m-2 rounded-sm border-b-2 border-stone-800">
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => login?.setEmail?.(e)}
              value={login?.email}
              className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
          <div className="m-2 rounded-sm border-b-2 border-stone-800">
            <div className="relative flex items-center rounded-sm ring-sky-500 transition-shadow focus-within:ring-2">
              <input
                id="password"
                type={login?.showPassword ? "text" : "password"}
                className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
                placeholder="Password"
                value={login?.password}
                onChange={(e) => login?.setPassword?.(e)}
              />
              <div
                className="relative cursor-pointer"
                onClick={(e) => login?.toggleShowPassword(e)}
              >
                <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
                <span className="py-1 pl-1 pr-2 text-sm text-stone-400">
                  {login?.showPassword ? "hide" : "show"}
                </span>
              </div>
            </div>
          </div>
          <div className="m-2 mt-4 flex justify-between">
            <button
              className={
                "rounded-full px-4 py-2 transition-colors" +
                (login?.canLogin || login.loginLoading
                  ? " bg-emerald-200"
                  : " bg-stone-300 text-white") +
                (login?.canLogin
                  ? " hover:bg-emerald-900 hover:text-white"
                  : "")
              }
              onClick={(e) => login?.onLogin?.(e)}
              disabled={!login?.canLogin}
            >
              {login?.loginLoading && <CenteredLoadingDots />}
              <span className={login?.loginLoading ? " invisible" : ""}>
                Login
              </span>
            </button>
            <button
              className={
                "rounded-full px-4 py-2 transition-colors" +
                (login?.canRecover || login.recoverLoading
                  ? " bg-sky-200"
                  : " bg-stone-300 text-white") +
                (login?.canRecover ? " hover:bg-sky-900 hover:text-white" : "")
              }
              onClick={(e) => login?.onRecover?.(e)}
              disabled={!login?.canRecover}
            >
              {login?.recoverLoading && <CenteredLoadingDots />}
              <span className={login?.recoverLoading ? " invisible" : ""}>
                Recover
              </span>
            </button>
            <button
              className={
                "rounded-full px-4 py-2 transition-colors" +
                (login?.canSignUp || login.signUpLoading
                  ? " bg-emerald-200"
                  : " bg-stone-300 text-white") +
                (login?.canSignUp
                  ? " hover:bg-emerald-900 hover:text-white"
                  : "")
              }
              onClick={(e) => login?.onSignUp?.(e)}
              disabled={!login?.canSignUp}
            >
              {login?.signUpLoading && <CenteredLoadingDots />}
              <span className={login?.signUpLoading ? " invisible" : ""}>
                Sign Up
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const PureLoginModal = (modal) => {
  return (
    <div className="fixed left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-sky-100 bg-opacity-50">
      <div className="flex w-full max-w-xs flex-col items-center justify-center">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="mb-6">{modal?.text}</p>
          <div className="flex justify-center">
            <button
              className="rounded-full bg-emerald-200 px-4 py-1 hover:bg-emerald-900 hover:text-white"
              onClick={(e) => modal?.onClose?.(e)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
