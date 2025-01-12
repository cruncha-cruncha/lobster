import { useState } from "react";
import { useNavigate } from "react-router";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import { PureInfoModal } from "../components/InfoModal";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";

export const validateEmail = (email) => {
  return new RegExp(/^.+@.+\..+$/).test(email);
};

export const useLogin = () => {
  const libraryInfo = useLibraryInfo();
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, _setEmail] = useState("");

  const validEmail = validateEmail(email);

  const onLogin = async () => {
    auth
      .login({
        email,
      })
      .then(() => {
        navigate("/tools");
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const setEmail = (e) => {
    _setEmail(e.target.value);
  };

  return {
    libraryName: libraryInfo.name,
    email,
    setEmail,
    onLogin,
    canLogin: validEmail,
  };
};

export const PureLogin = (login) => {
  const {
    modal,
    libraryName,
    email,
    setEmail,
    onLogin,
    canLogin,
    loginLoading,
  } = login;

  return (
    <>
      <PureInfoModal {...modal} />
      <div className="flex min-h-full items-stretch justify-center">
        <div className="relative flex w-full max-w-5xl justify-center">
          <div className="absolute left-0 right-0 top-0 p-2 text-center">
            <h1>{libraryName}</h1>
          </div>
          <div className="flex w-full max-w-sm flex-col justify-center">
            <div className="p-2">
              <h1 className="mb-2 text-left text-xl">Login</h1>
              <form onSubmit={(e) => e.preventDefault()}>
                <TextInput
                  placeholder="email address"
                  value={email}
                  onChange={setEmail}
                  disabled={loginLoading}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    color="green"
                    text="Login"
                    disabled={!canLogin}
                    onClick={onLogin}
                    isLoading={loginLoading}
                  />
                </div>
              </form>
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
