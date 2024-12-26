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
    case "maximumRentalPeriod":
      return { ...state, maximumRentalPeriod: action.value };
    case "maximumFuture":
      return { ...state, maximumFuture: action.value };
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
    maximumRentalPeriod: remoteInfo.maximumRentalPeriod,
    maximumFuture: remoteInfo.maximumFuture,
  });

  const canSave =
    (info.name !== remoteInfo.name ||
      info.maximumRentalPeriod != remoteInfo.maximumRentalPeriod ||
      info.maximumFuture != remoteInfo.maximumFuture) &&
    (info.maximumRentalPeriod === "" ||
      parseInt(info.maximumRentalPeriod, 10) >= 0) &&
    (info.maximumFuture === "" || parseInt(info.maximumFuture, 10) >= 0) &&
    !isLoading;

  const save = (e) => {
    e.preventDefault();

    setIsLoading(true);

    endpoints
      .updateLibrary({
        info: {
          name: info.name,
          maximumRentalPeriod:
            parseInt(info.maximumRentalPeriod, 10) || undefined,
          maximumFuture: parseInt(info.maximumFuture, 10) || undefined,
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
    setMaximumRentalPeriod: (e) =>
      dispatch({ type: "maximumRentalPeriod", value: e.target.value }),
    setMaximumFuture: (e) =>
      dispatch({ type: "maximumFuture", value: e.target.value }),
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
    setMaximumRentalPeriod,
    setMaximumFuture,
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
            value={info.maximumRentalPeriod}
            onChange={setMaximumRentalPeriod}
          />
          <p>The longest time any tool can be rented, in hours.</p>
        </fieldset>
        <fieldset className="my-4">
          <TextInput
            label="Max Future Scheduled time"
            placeholder="days"
            value={info.maximumFuture}
            onChange={setMaximumFuture}
            />
          <p>The furthest in future someone can enter a rental, in days.</p>
        </fieldset>

        <div className="mt-4 flex">
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
