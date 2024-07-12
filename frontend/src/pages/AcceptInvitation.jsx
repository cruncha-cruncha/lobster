import { useReducer, useState, useEffect } from "react";
import { validateEmail, validatePassword } from "./Login";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import { useRouter } from "../components/router/Router";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

const initialState = {
  code: "",
  name: "",
  email: "",
  password: "",
  language: 0,
  country: 0,
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
    case "country":
      return { ...state, country: action.payload };
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
};

export const useAcceptInvitation = (props) => {
  const modal = useInfoModal();
  const router = useRouter();
  const auth = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const validEmail = validateEmail(state.email);
  const validPassword = validatePassword(state.password);

  useEffect(() => {
    let mounted = true;

    endpoints.getLanguages().then((res) => {
      if (res.status === 200 && mounted) {
        setLanguageOptions(
          res.data.map((lang) => ({
            value: lang.id,
            label: lang.name,
          })),
        );
      }
    });

    endpoints.getCountries().then((res) => {
      if (res.status === 200 && mounted) {
        setCountryOptions(
          res.data.map((country) => ({
            value: country.id,
            label: country.name,
          })),
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const canAccept =
    state.code &&
    state.name &&
    validEmail &&
    validPassword &&
    state.language &&
    state.country &&
    !isLoading;

  const onAccept = async (e) => {
    setIsLoading(true);

    const showErrModal = () =>
      modal.open(
        "Request failed. Please check your credentials and try again later, or ask for a new code.",
        "error",
      );

    endpoints
      .acceptInvitation({
        code: state.code,
        name: state.name,
        email: state.email,
        password: state.password,
        language: state.language,
        country: state.country,
      })
      .then((res) => {
        if (res.status !== 200) {
          showErrModal();
        } else {
          auth.login({
            userId: res.data.user_id,
            claimsLevel: res.data.claims_level,
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
          });

          router.goTo(`/profile/${res.data.user_id}`, "back", true);
        }
      }, showErrModal)
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    ...state,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    setCode: (e) => dispatch({ type: "code", payload: e.target.value }),
    setFirstName: (e) => dispatch({ type: "name", payload: e.target.value }),
    setEmail: (e) => dispatch({ type: "email", payload: e.target.value }),
    setPassword: (e) => dispatch({ type: "password", payload: e.target.value }),
    setLanguage: (e) => dispatch({ type: "language", payload: e.target.value }),
    setCountry: (e) => dispatch({ type: "country", payload: e.target.value }),
    onAccept,
    languageOptions,
    countryOptions,
    canAccept,
    isLoading,
    modal,
  };
};

export const AcceptInvitation = (props) => {
  const acceptInvitation = useAcceptInvitation(props);
  return <PureAcceptInvitation {...acceptInvitation} />;
};

export const PureAcceptInvitation = (acceptInvitation) => {
  return (
    <>
      <PureInfoModal {...acceptInvitation?.modal} />
      <div className="flex min-h-full items-center justify-center p-2">
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
                onClick={(e) => acceptInvitation?.toggleShowPassword?.(e)}
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
            {acceptInvitation?.languageOptions?.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <select
            className={
              "m-2 rounded-sm border-b-2 border-stone-800 bg-white px-2 py-1" +
              (acceptInvitation?.country != "0" ? "" : " text-stone-400")
            }
            value={acceptInvitation?.country}
            onChange={(e) => acceptInvitation?.setCountry?.(e)}
          >
            <option value="0" disabled className="placeholder">
              Country
            </option>
            {acceptInvitation?.countryOptions?.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          <div className="mt-4 flex justify-center">
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
              onClick={(e) => acceptInvitation?.onAccept?.(e)}
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
    </>
  );
};
