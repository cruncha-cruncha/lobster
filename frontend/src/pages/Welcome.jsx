import { Button } from "../components/Button";
import { useAuth } from "../state/auth";
import { useLibraryInfo } from "../state/libraryInfo";
import { useMyStores } from "../state/myStores";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

export const useWelcome = () => {
  const { userId, accessToken } = useAuth();
  const { stores } = useMyStores();

  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
    mutate: mutateUser,
  } = useSWR(
    !accessToken || !userId ? null : `get user ${userId}, using ${accessToken}`,
    () => endpoints.getUser({ id: userId, accessToken }),
  );

  const { name: libraryName } = useLibraryInfo();

  const goToMyProfile = () => `/people/${userId}`;

  const goToStore = (storeId) => `/stores/${storeId}`;

  return {
    libraryName,
    goToMyProfile,
    goToStore,
    stores,
    userData,
  };
};

export const PureWelcome = (newStore) => {
  const { libraryName, goToMyProfile, goToStore, stores, userData } = newStore;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h2 className="mr-2 text-xl">
          Welcome
          {!userData?.username?.trim() ? "" : `, ${userData.username.trim()}`}
        </h2>
      </div>
      <div className="my-2 px-2">
        <p>
          Click near the top of the page (where it says {libraryName}) to open
          the navigation menu.
        </p>
      </div>
      <div className="my-2 flex items-center gap-2 px-2">
        <Button
          text="My Profile"
          goTo={goToMyProfile()}
          variant="blue"
          size="sm"
        />
        <p>You can click this button to go to your profile.</p>
      </div>
      {stores.length > 0 && (
        <div className="my-2 px-2">
          <p>Click any store name below to go directly to that store page.</p>
          {stores.map((store) => (
            <div key={store.id} className="my-2">
              <Button
                text={store.name}
                goTo={goToStore(store.id)}
                variant="blue"
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Welcome = () => {
  const welcome = useWelcome();
  return <PureWelcome {...welcome} />;
};
