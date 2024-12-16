import { useState, useEffect } from "react";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import { useAuth } from "../components/userAuth";
import { useRouter } from "../components/router/Router";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import * as endpoints from "../api/endpoints";

export const useSetupLibrary = () => {
  const [name, _setName] = useState("");

  const onConfirm = async () => {
    console.log("confirming");

    endpoints
      .createLibrary({ name })
      .then((res) => {
        console.log(res);
      })
  };

  const onSignUp = async () => {
    setIsLoading("signUp");

    const showErrModal = () =>
      modal.open(
        "Request failed. There may already be a user with this email address.",
        "error",
      );

    endpoints
      .requestInvitation({ email })
      .then((res) => {
        if (res.status !== 200) {
          showErrModal();
        } else {
          modal.open(
            "Invitation request sent. Please contact a moderator for next steps.",
          );
        }
      }, showErrModal)
      .finally(() => {
        setIsLoading("");
      });
  };

  const setName = (e) => {
    _setName(e.target.value);
  };

  return {
    name,
    setName,
    onConfirm,
    canConfirm: name.length > 0,
  };
};

export const PureSetupLibrary = (setupLibrary) => {
  return (
    <>
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-2 flex w-full max-w-sm flex-col justify-center">
          <h1 className="mb-2 text-center text-xl">Welcome</h1>
          <p>
            Welcome to your new tool lending library. What do you want the
            library to be called?
          </p>
          <div className="my-2 border-2 border-stone-800">
            <input
              type="text"
              placeholder="Name"
              onChange={(e) => setupLibrary?.setName?.(e)}
              value={setupLibrary?.name}
              className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
          <p>
            This can be changed later, but needs to be set up now for internal
            purposes.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              className={
                "rounded-full px-4 py-2 transition-colors" +
                (setupLibrary?.canConfirm
                  ? " bg-emerald-200"
                  : " bg-stone-300 text-white") +
                (setupLibrary?.canConfirm
                  ? " hover:bg-emerald-900 hover:text-white"
                  : "")
              }
              onClick={(e) => setupLibrary?.onConfirm?.(e)}
              disabled={!setupLibrary?.canConfirm}
            >
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const SetupLibrary = (props) => {
  const setupLibrary = useSetupLibrary(props);
  return <PureSetupLibrary {...setupLibrary} />;
};
