import { useState } from "react";
import { useLibraryInfo } from "../state/libraryInfo";
import { useAuth } from "../state/auth";
import { CenteredLoadingDots } from "../components/loading/LoadingDots";
import * as endpoints from "../api/endpoints";

export const useLibrary = () => {
  const libraryInfo = useLibraryInfo();
  const auth = useAuth();
  const [name, setName] = useState(libraryInfo.name);
  const [maxRentalPeriod, setMaxRentalPeriod] = useState(
    libraryInfo.maxRentalPeriod,
  );
  const [maxFuture, setMaxFuture] = useState(libraryInfo.maxFuture);
  const [isLoading, setIsLoading] = useState(false);

  const canSave =
    (name !== libraryInfo.name ||
      maxRentalPeriod != libraryInfo.maxRentalPeriod ||
      maxFuture != libraryInfo.maxFuture) &&
    (maxRentalPeriod === "" || parseInt(maxRentalPeriod, 10) >= 0) &&
    (maxFuture === "" || parseInt(maxFuture, 10) >= 0) &&
    !isLoading;

  const save = (e) => {
    e.preventDefault();

    setIsLoading(true);

    endpoints
      .updateLibrary({
        name,
        maxRentalPeriod: parseInt(maxRentalPeriod, 10) || undefined,
        maxFuture: parseInt(maxFuture, 10) || undefined,
        accessToken: auth.accessToken,
      })
      .then(() => libraryInfo.refresh())
      .catch((e) => {
        alert("Failed to save library settings");
        console.error(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    info: libraryInfo,
    name,
    setName: (e) => setName(e.target.value),
    maxRentalPeriod,
    setMaxRentalPeriod: (e) => setMaxRentalPeriod(e.target.value),
    maxFuture,
    setMaxFuture: (e) => setMaxFuture(e.target.value),
    isLoading,
    canSave,
    save,
  };
};

export const PureLibrary = (library) => {
  return (
    <div>
      <h2>Library Settings</h2>
      <p>(id: "{library?.info?.uuid}")</p>
      <form>
        <fieldset className="my-4">
          <label htmlFor="name">Name</label>
          <div className="my-2 border-2 border-stone-800">
            <input
              id="name"
              type="text"
              placeholder="Library Name"
              value={library?.name}
              onChange={(e) => library?.setName?.(e)}
              className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
        </fieldset>
        <fieldset className="my-4">
          <label htmlFor="maxRentalPeriod">Max Rental Period</label>
          <p>The longest time any tool can be rented, in hours.</p>
          <div className="my-2 w-40 max-w-full border-2 border-stone-800">
            <input
              id="maxRentalPeriod"
              type="text"
              placeholder="hours"
              value={library?.maxRentalPeriod}
              onChange={(e) => library?.setMaxRentalPeriod?.(e)}
              className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
        </fieldset>
        <fieldset className="my-4">
          <label htmlFor="maxFuture">Max Future Scheduled time</label>
          <p>The furthest in future someone can enter a rental, in days.</p>
          <div className="my-2 w-40 max-w-full border-2 border-stone-800">
            <input
              id="maxFuture"
              type="text"
              placeholder="days"
              value={library?.maxFuture}
              onChange={(e) => library?.setMaxFuture?.(e)}
              className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
        </fieldset>

        <div className="mt-4 flex">
          <button
            onClick={library?.save}
            disabled={!library?.canSave}
            className={
              "rounded-full px-4 py-2 transition-colors" +
              (library?.canSave
                ? " bg-emerald-200 hover:bg-emerald-900 hover:text-white"
                : " bg-stone-300 text-white")
            }
          >
            {library?.isLoading && <CenteredLoadingDots />}
            <span className={library?.isLoading ? "invisible" : ""}>Save</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const Library = () => {
  const library = useLibrary();
  return <PureLibrary {...library} />;
};
