import { useReducer, useState, useEffect } from "react";
import { Link } from "react-router";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Checkbox } from "../components/Checkbox";
import { Select } from "../components/Select";
import { useDebounce } from "../components/useDebounce";
import { usePrevNext, PurePrevNext } from "../components/PrevNext";
import { SearchSelect } from "../components/SearchSelect";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "term":
      return { ...state, term: action.value };
    case "withUser":
      return { ...state, withUser: action.value };
    default:
      return state;
  }
};

export const useStores = () => {
  const { accessToken } = useAuth();
  const { storeStatuses } = useConstants();
  const pageControl = usePrevNext();
  const [storeList, setStoreList] = useState([]);
  const _singleUserSelect = useSingleUserSelect();
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    status: "1",
    term: "",
    withUser: false,
  });

  const goToNewStore = () => "/stores/new";

  const goToStore = (id) => `/stores/${id}`;

  const setStatus = (e) => {
    paramsDispatch({ type: "status", value: e.target.value });
    pageControl.setPage(1);
  };

  const setTerm = (e) => {
    paramsDispatch({ type: "term", value: e.target.value });
  };

  const setWithUser = (e) => {
    paramsDispatch({ type: "withUser", value: e.target.checked });
    pageControl.setPage(1);
  };

  const debouncedTerm = useDebounce(params.term, 400);

  useEffect(() => {
    if (params.term === debouncedTerm) {
      pageControl.setPage(1);
    }
  }, [params.term, debouncedTerm]);

  const endpointParams = {
    term: debouncedTerm,
    userIds: params.withUser ? [_singleUserSelect.userId] : [],
    page: pageControl.pageNumber,
    statuses: params.status == "0" ? "" : [parseInt(params.status, 10)],
  };

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken
      ? null
      : `get stores, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchStores({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStoreList(data.stores);
    }
  }, [data]);

  const singleUserSelect = {
    ..._singleUserSelect,
    setUserId: (id) => {
      pageControl.setPage(1);
      _singleUserSelect.setUserId(id);
    },
  };

  return {
    storeList,
    storeStatuses: [{ id: "0", name: "Any" }, ...storeStatuses],
    params,
    goToNewStore,
    goToStore,
    setStatus,
    setTerm,
    setWithUser,
    pageControl,
    singleUserSelect,
  };
};

export const PureStores = (stores) => {
  const {
    goToNewStore,
    goToStore,
    params,
    setTerm,
    setStatus,
    setWithUser,
    storeStatuses,
    storeList,
    pageControl,
    singleUserSelect,
  } = stores;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h2 className="mr-2 text-xl">Stores</h2>
        <div className="flex gap-2">
          <Button
            goTo={goToNewStore()}
            text="New Store"
            variant="blue"
            size="sm"
          />
        </div>
      </div>
      <div className="px-2">
        <p>
          Here you can search for stores by name, location, email address, or
          phone number. Generally a 'store' corresponds to someone's apartment.
          Click on one of the results to see more details about the store. If
          you're interested in providing tools to the network, start by creating
          a your own store.
        </p>
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <TextInput
          id={`store-term`}
          value={params.term}
          onChange={setTerm}
          placeholder="Some Store"
          label="Search"
        />
        <Select
          id={`store-status`}
          label="Status"
          options={storeStatuses}
          value={params.status}
          onChange={setStatus}
        />
        <Checkbox
          id="store-with-person"
          label="Related to a User"
          checked={params.withUser}
          onChange={setWithUser}
        />
        {params.withUser && (
          <div>
            <PureSingleUserSelect {...singleUserSelect} />
          </div>
        )}
      </div>
      <div>
        <ul className="mb-3 mt-4 overflow-y-auto border-x-2 border-stone-400 px-2 [&>*:first-child]:mt-1 [&>*:last-child]:mb-1 [&>*]:my-2">
          {storeList.length == 0 && (
            <li className="text-stone-400">no results</li>
          )}
          {storeList.map((store) => (
            <li key={store.id}>
              <Link to={goToStore(store.id)} className="cursor-pointer">
                <p>
                  {store.name.trim()},{" "}
                  {store.location.trim() ? (
                    store.location.trim()
                  ) : (
                    <span className="text-stone-400">no location</span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <PurePrevNext {...pageControl} />
    </div>
  );
};

export const useSingleUserSelect = () => {
  const { accessToken } = useAuth();
  const [user, _setUser] = useState(null);
  const [userTerm, _setUserTerm] = useState("");
  const [userOptions, setUserOptions] = useState([]);

  const setUserTerm = (e) => {
    _setUserTerm(e.target.value);
  };

  const setUserId = (id) => {
    const user = userOptions.find((user) => user.id === id);
    user && _setUser(user);
    user && _setUserTerm(user.username);
  };

  const endpointParams = {
    term: userTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchUsers({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserOptions(
        data.users.map((user) => ({ ...user, name: user.username })),
      );
    }
  }, [data]);

  const clear = () => {
    _setUser(null);
    _setUserTerm("");
  };

  return {
    userId: user ? user.id : null,
    user,
    userTerm,
    userOptions,
    setUserTerm,
    setUserId,
    clear,
  };
};

export const PureSingleUserSelect = (singleUserSelect) => {
  const { userTerm, userOptions, setUserTerm, setUserId } = singleUserSelect;

  return (
    <SearchSelect
      id={`single-user-select`}
      label="User"
      value={userTerm}
      onChange={setUserTerm}
      options={userOptions}
      onSelect={setUserId}
    />
  );
};

export const Stores = (props) => {
  const stores = useStores(props);
  return <PureStores {...stores} />;
};
