import { useState } from "react";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import * as endpoints from "../api/endpoints";
import { useLibraryInfo } from "../state/libraryInfo";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";

export const useSetupLibrary = () => {
  const libraryInfo = useLibraryInfo();
  const [name, _setName] = useState("");

  const onConfirm = async () => {
    endpoints
      .createLibrary({ name })
      .then((_) => {
        return libraryInfo.refresh();
      })
      .catch((e) => {
        console.error(e);
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
  const {
    name,
    setName,
    onConfirm,
    canConfirm,
  } = setupLibrary;

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="mx-2 flex w-full max-w-sm flex-col justify-center">
        <h1 className="mb-2 text-center text-xl">Welcome</h1>
        <p>
          Welcome to your new tool lending network. What would you like the
          network to be called?
        </p>
        <div className="my-2 border-2 border-stone-800">
          <input
            type="text"
            placeholder="Network Name"
            onChange={setName}
            value={name}
            className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
          />
        </div>
        <p>
          This can be changed later, but needs to be set up now for internal
          purposes.
        </p>
        <p>
          After setup, you will be taken to a login screen. Your account will
          get all permissions.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button 
            onClick={onConfirm}
            text="Confirm"
            disabled={!canConfirm}            
          />
        </div>
      </div>
    </div>
  );
};

export const SetupLibrary = (props) => {
  const setupLibrary = useSetupLibrary(props);
  return <PureSetupLibrary {...setupLibrary} />;
};
