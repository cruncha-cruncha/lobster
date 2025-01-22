import { useState, useReducer } from "react";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";

const reducer = (state, action) => {
  switch (action.type) {
    case "name":
      return { ...state, name: action.value };
    default:
      return state;
  }
};

export const useLibrary = () => {
  const remoteInfo = useLibraryInfo();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [info, dispatch] = useReducer(reducer, {
    name: remoteInfo.name,
  });

  const canSave = info.name !== remoteInfo.name && !isLoading;

  const save = (e) => {
    e.preventDefault();

    setIsLoading(true);

    endpoints
      .updateLibrary({
        info: {
          name: info.name,
        },
        accessToken: auth.accessToken,
      })
      .then(() => remoteInfo.refresh())
      .catch((e) => {
        alert("Failed to save library settings");
        console.error(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    uuid: remoteInfo.uuid,
    info,
    setName: (e) => dispatch({ type: "name", value: e.target.value }),
    isLoading,
    canSave,
    save,
  };
};

export const PureLibrary = (library) => {
  const { uuid, info, setName, canSave, save, isLoading } = library;

  return (
    <div>
      <h1 className="my-2 px-2 text-xl">Network Settings</h1>
      <p className="px-2">(id: "{uuid}")</p>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <TextInput
          id={`library-name`}
          label="Name"
          placeholder="Network Name"
          value={info.name}
          onChange={setName}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2 px-2">
        <Button
          onClick={save}
          disabled={!canSave}
          text="Save"
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export const Library = () => {
  const library = useLibrary();
  return <PureLibrary {...library} />;
};
