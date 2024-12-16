import { useState, useEffect } from "react";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import { useAuth } from "../components/userAuth";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import * as endpoints from "../api/endpoints";

export const validateEmail = (email) => {
  return new RegExp(/^.+@.+\..+$/).test(email);
};

export const validatePassword = (password) => {
  return password.length > 16;
};

export const useLogin = () => {
  const [email, _setEmail] = useState("");

  const validEmail = validateEmail(email);

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
      <div className="flex min-h-full items-center justify-center">
        <div className="flex w-full max-w-sm flex-col justify-center">
          <h1 className="mb-2 text-center text-xl">Title</h1>
          <div className="m-2 rounded-sm border-b-2 border-stone-800">
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => login?.setEmail?.(e)}
              value={login?.email}
              className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
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
