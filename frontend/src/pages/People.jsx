import { useState, useReducer, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import useSWR from "swr";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { useAuth } from "../state/auth";
import { useDebounce } from "../components/useDebounce";
import * as endpoints from "../api/endpoints";
import { usePrevNext, PurePrevNext } from "../components/PrevNext";
import { URL_STORE_ID_KEY } from "./Store";
import { Button } from "../components/Button";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "searchTerm":
      return { ...state, searchTerm: action.value };
    case "role":
      return { ...state, role: action.value };
    case "storeId":
      return { ...state, storeId: action.value };
    case "withStore":
      return { ...state, withStore: action.value };
    default:
      return state;
  }
};

export const usePeople = () => {
  const [urlParams, setUrlParams] = useSearchParams();
  const { roles, userStatuses } = useConstants();
  const { userId, accessToken } = useAuth();
  const [peopleList, setPeopleList] = useState([]);
  const pageControl = usePrevNext();
  const _storeSelect = useSingleStoreSelect();
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    searchTerm: "",
    storeId: "0",
    withStore: false,
    status: "1",
    role: "0",
  });
  const debouncedSearchTerm = useDebounce(params.searchTerm, 400);
  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);

  useEffect(() => {
    if (params.searchTerm === debouncedSearchTerm) {
      pageControl.setPage(1);
    }
  }, [params.searchTerm, debouncedSearchTerm]);

  const setStatus = (e) => {
    paramsDispatch({ type: "status", value: e.target.value });
    pageControl.setPage(1);
  };

  const setSearchTerm = (e) => {
    paramsDispatch({ type: "searchTerm", value: e.target.value });
  };

  const setRole = (e) => {
    paramsDispatch({ type: "role", value: e.target.value });
    pageControl.setPage(1);
  };

  const storeSelect = {
    ..._storeSelect,
    storeOptions: params.withStore ? _storeSelect.storeOptions : [],
    setStoreId: (id) => {
      paramsDispatch({ type: "storeId", value: id });
      pageControl.setPage(1);
      urlParams.set(URL_STORE_ID_KEY, id);
      setUrlParams(urlParams);
      _storeSelect.setStoreId(id);
    },
    setStoreTerm: (e) => {
      if (!params.withStore) paramsDispatch({ type: "withStore", value: true });
      _storeSelect.setStoreTerm(e);
    },
  };

  const setWithStore = (e) => {
    const checked = e.target.checked;
    paramsDispatch({ type: "withStore", value: checked });
    pageControl.setPage(1);
    if (!checked && urlParams.has(URL_STORE_ID_KEY)) {
      urlParams.delete(URL_STORE_ID_KEY);
      setUrlParams(urlParams);
    } else if (checked && params.storeId != 0) {
      urlParams.set(URL_STORE_ID_KEY, params.storeId);
      setUrlParams(urlParams);
    }
  };

  {
    const { data, isLoading, error, mutate } = useSWR(
      !urlStoreId || !accessToken || params.storeId != 0
        ? null
        : `get store ${urlStoreId}, using ${accessToken}`,
      () => endpoints.getStore({ id: urlStoreId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        storeSelect.setStoreTerm({ target: { value: data.name } });
      }
    }, [data]);
  }

  const endpointParams = {
    term: debouncedSearchTerm,
    storeIds: urlStoreId
      ? [parseInt(urlStoreId, 10)]
      : params.storeId === "0" || !params.withStore
      ? ""
      : [parseInt(params.storeId, 10)],
    statuses: params.status === "0" ? "" : [parseInt(params.status, 10)],
    roles: params.role === "0" ? "" : [parseInt(params.role, 10)],
    page: pageControl.pageNumber,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchUsers({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setPeopleList(data.users);
    }
  });

  const goToPerson = (id) => `/people/${id}`;

  const goToMyProfile = () => `/people/${userId}`;

  return {
    roles: [{ id: "0", name: "Any" }, ...roles],
    userStatuses: [{ id: "0", name: "Any" }, ...userStatuses],
    params,
    peopleList,
    setStatus,
    setSearchTerm,
    setRole,
    setWithStore,
    storeSelect,
    goToPerson,
    goToMyProfile,
    pageControl,
  };
};

export const PurePeople = (people) => {
  const {
    roles,
    userStatuses,
    params,
    peopleList,
    setStatus,
    setSearchTerm,
    setRole,
    setWithStore,
    storeSelect,
    goToPerson,
    goToMyProfile,
    pageControl,
  } = people;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h2 className="mr-2 text-xl">People</h2>
        <Button
          text="My Profile"
          goTo={goToMyProfile()}
          variant="blue"
          size="sm"
        />
      </div>
      <div className="px-2">
        <p>
          Here you can search for people in the network by username (and/or
          email if you're a user administrator). This page can also be used to
          find all people associated with a store. Click on one of the results
          to see more information about a user, as well as links to their
          rentals and grievances (accused).
        </p>
      </div>
      <div className="mb-3 mt-1 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextInput
            id={`people-search`}
            value={params.searchTerm}
            onChange={setSearchTerm}
            placeholder="Enigo Montoya"
            label="Username"
          />
        </div>
        <Select
          id={`people-role`}
          label="Role"
          options={roles}
          value={params.role}
          onChange={setRole}
        />
        <Select
          id={`people-status`}
          label="Status"
          options={userStatuses}
          value={params.status}
          onChange={setStatus}
        />
        <Checkbox
          id="person-with-store"
          label="Related to Store"
          checked={params.withStore}
          onChange={setWithStore}
        />
        {params.withStore && (
          <div className="md:col-span-2">
            <PureSingleStoreSelect {...storeSelect} />
          </div>
        )}
      </div>
      <div>
        <ul className="mb-3 mt-4 border-x-2 border-stone-400 px-2">
          {peopleList.length == 0 && (
            <li className="text-stone-400">no results</li>
          )}
          {peopleList.map((person) => (
            <Link
              key={person.id}
              to={goToPerson(person.id)}
              className="mb-2 cursor-pointer"
            >
              <p>
                {person.username}
                {person.emailAddress && `, ${person.emailAddress}`}
              </p>
            </Link>
          ))}
        </ul>
      </div>
      <PurePrevNext {...pageControl} />
    </div>
  );
};

export const useSingleStoreSelect = ({ filterParams = {} } = {}) => {
  const { accessToken } = useAuth();
  const [storeId, _setStoreId] = useState("");
  const [storeTerm, _setStoreTerm] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);

  const setStoreTerm = (e) => {
    _setStoreTerm(e.target.value);
  };

  const setStoreId = (id) => {
    _setStoreId(id);
    const storeName = storeOptions.find((store) => store.id === id)?.name;
    storeName && _setStoreTerm(storeName);
  };

  const endpointParams = {
    term: storeTerm,
    ...filterParams,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get stores, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchStores({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStoreOptions(data.stores);
    }
  }, [data]);

  return {
    storeId,
    storeTerm,
    storeOptions,
    setStoreTerm,
    setStoreId,
  };
};

export const PureSingleStoreSelect = (storeSelect) => {
  const { storeTerm, storeOptions, setStoreTerm, setStoreId } = storeSelect;

  return (
    <SearchSelect
      id={`single-store-select`}
      label="Store"
      value={storeTerm}
      onChange={setStoreTerm}
      options={storeOptions}
      onSelect={setStoreId}
    />
  );
};

export const People = () => {
  const people = usePeople();
  return <PurePeople {...people} />;
};
