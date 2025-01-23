import { useState } from "react";
import { useNavigate } from "react-router";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import { PureInfoModal, useInfoModal } from "../components/InfoModal";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useConstants } from "../state/constants";
import * as endpoints from "../api/endpoints";

export const validatePassword = (password) => {
  return password.length >= 4;
};

export const validateEmail = (email) => {
  return new RegExp(/^.+@.+\..+$/).test(email);
};

export const useLogin = () => {
  const libraryInfo = useLibraryInfo();
  const navigate = useNavigate();
  const { userStatuses } = useConstants();
  const auth = useAuth();
  const [email, _setEmail] = useState("");
  const [password, _setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const modal = useInfoModal();

  const validEmail = validateEmail(email);
  const validPassword = validatePassword(password);

  const handleSignup = async () => {
    setIsLoading(true);

    return endpoints
      .signUp({
        email,
        password,
      })
      .then((data) => {
        if (userStatuses.find((s) => s.id === data.status)?.name === "active") {
          return handleLogin();
        }

        return modal.open("Account pending, please wait for verification.", "");
      })
      .catch(() => {
        modal.open("Error creating account", "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLogin = async () => {
    setIsLoading(true);

    return auth
      .login({
        email,
        password,
      })
      .then(() => {
        navigate("/welcome");
      })
      .catch(() => {
        modal.open("Incorrect username or password", "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const setEmail = (e) => {
    _setEmail(e.target.value);
  };

  const setPassword = (e) => {
    _setPassword(e.target.value);
  };

  return {
    modal,
    libraryName: libraryInfo.name,
    email,
    setEmail,
    password,
    setPassword,
    handleLogin,
    handleSignup,
    canLogin: validEmail && validPassword,
    canSignUp: validEmail && validPassword,
    isLoading,
  };
};

export const PureLogin = (login) => {
  const {
    modal,
    libraryName,
    email,
    setEmail,
    password,
    setPassword,
    handleLogin,
    handleSignup,
    canLogin,
    canSignUp,
    isLoading,
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
                <div className="grid grid-cols-1 gap-x-4 gap-y-2">
                  <TextInput
                    id={`login-email`}
                    placeholder="email address"
                    value={email}
                    onChange={setEmail}
                    disabled={isLoading}
                  />
                  <TextInput
                    id={`login-password`}
                    placeholder="password"
                    hideText={true}
                    value={password}
                    onChange={setPassword}
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    color="green"
                    text="Sign Up"
                    disabled={!canSignUp}
                    onClick={handleSignup}
                    isLoading={isLoading}
                  />
                  <Button
                    color="green"
                    text="Login"
                    typeSubmit={true}
                    disabled={!canLogin}
                    onClick={handleLogin}
                    isLoading={isLoading}
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
