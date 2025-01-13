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
    case "maximumRentalHours":
      return { ...state, maximumRentalHours: action.value };
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
    maximumRentalHours: remoteInfo.maximumRentalHours,
  });

  const canSave =
    (info.name !== remoteInfo.name ||
      info.maximumRentalHours != remoteInfo.maximumRentalHours) &&
    (info.maximumRentalHours === "" ||
      parseInt(info.maximumRentalHours, 10) >= 0) &&
    !isLoading;

  const save = (e) => {
    e.preventDefault();

    setIsLoading(true);

    endpoints
      .updateLibrary({
        info: {
          name: info.name,
          maximumRentalHours:
            parseInt(info.maximumRentalHours, 10) || data.maximumRentalHours,
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
    setMaximumRentalHours: (e) =>
      dispatch({ type: "maximumRentalHours", value: e.target.value }),
    isLoading,
    canSave,
    save,
  };
};

export const PureLibrary = (library) => {
  const {
    uuid,
    info,
    setName,
    setMaximumRentalHours,
    canSave,
    save,
    isLoading,
  } = library;

  return (
    <div>
      <h2>Library Settings</h2>
      <p>(id: "{uuid}")</p>
      <form>
        <fieldset className="my-4">
          <TextInput
            label="Name"
            placeholder="Library Name"
            value={info.name}
            onChange={setName}
          />
        </fieldset>
        <fieldset className="my-4">
          <TextInput
            label="Max Rental Period"
            placeholder="hours"
            value={info.maximumRentalHours}
            onChange={setMaximumRentalHours}
          />
          <p>The longest time any tool can be rented, in hours.</p>
        </fieldset>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={save}
            disabled={!canSave}
            text="Save"
            loading={isLoading}
          />
        </div>
      </form>
    </div>
  );
};

export const Library = () => {
  const library = useLibrary();
  return <PureLibrary {...library} />;
};
