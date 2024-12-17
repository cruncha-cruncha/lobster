import { useState, useEffect } from "react";
import useSWR from "swr";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
// import { useAuth } from "../state/auth";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import * as endpoints from "../api/endpoints";
import { useLibraryInfo } from "../state/libraryInfo";

export const validateEmail = (email) => {
  return new RegExp(/^.+@.+\..+$/).test(email);
};

export const useLogin = () => {
  const libraryInfo = useLibraryInfo();
  const [email, _setEmail] = useState("");

  const validEmail = validateEmail(email);

  // const { data, error, isLoading, isValidating, mutate } = useSWR(
  //   "/library",
  //   fetcher,
  //   options,
  // );

  const onLogin = async () => {
    endpoints
      .login({ email })
      .then((res) => {
        if (res.status === 200) {
          // auth.login({
          //   accessToken: res.data.access_token,
          //   refreshToken: res.data.refresh_token,
          // });

          // router.goTo(`/profile/${res.data.user_id}`, "forward", true);
          console.log("success", res.data);
        } else {
          console.error(res.status, res);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const setEmail = (e) => {
    _setEmail(e.target.value);
  };

  return {
    libraryName: libraryInfo.get.name,
    email,
    setEmail,
    onLogin,
    canLogin: validEmail,
  };
};

export const PureLogin = (login) => {
  return (
    <>
      <PureInfoModal {...login?.modal} />
      <div className="flex min-h-full items-stretch justify-center">
        <div className="relative flex w-full max-w-5xl justify-center">
          <div className="absolute left-0 top-0 p-2">
            <h1>{login?.libraryName}</h1>
          </div>
          <div className="flex w-full max-w-sm flex-col justify-center">
            <div className="p-2">
              <h1 className="text-left text-xl">Login</h1>
              <div className="my-2 border-2 border-stone-800">
                <input
                  type="text"
                  placeholder="email address"
                  onChange={(e) => login?.setEmail?.(e)}
                  value={login?.email}
                  className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
                />
              </div>
              <div className="mt-4 flex justify-end">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Login = (props) => {
  const login = useLogin(props);
  return <PureLogin {...login} />;
};
