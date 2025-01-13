import { useState, useReducer, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import useSWR from "swr";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { useAuth } from "../state/auth";
import { useDebounce } from "../components/useDebounce";
import * as endpoints from "../api/endpoints";
import { PrevNext } from "../components/PrevNext";
import { URL_STORE_ID_KEY } from "./Store";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "page":
      return { ...state, page: action.value };
    case "status":
      return { ...state, status: action.value, page: 1 };
    case "searchTerm":
      return { ...state, searchTerm: action.value, page: 1 };
    case "role":
      return { ...state, role: action.value, page: 1 };
    case "storeId":
      return { ...state, storeId: action.value, page: 1 };
    case "withStore":
      return { ...state, withStore: action.value, page: 1 };
    default:
      return state;
  }
};

export const usePeople = () => {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const { roles, userStatuses } = useConstants();
  const { accessToken } = useAuth();
  const [peopleList, setPeopleList] = useState([]);
  const _storeSelect = useSingleStoreSelect();
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    searchTerm: "",
    page: 1,
    storeId: "0",
    withStore: false,
    status: "1",
    role: "0",
  });
  const debouncedParams = useDebounce(params, 200);
  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);

  const prevPage = () => {
    if (params.page > 1) {
      paramsDispatch({ type: "page", value: params.page - 1 });
    }
  };

  const nextPage = () =>
    paramsDispatch({ type: "page", value: params.page + 1 });

  const setStatus = (e) =>
    paramsDispatch({ type: "status", value: e.target.value });

  const setSearchTerm = (e) =>
    paramsDispatch({ type: "searchTerm", value: e.target.value });

  const setRole = (e) =>
    paramsDispatch({ type: "role", value: e.target.value });

  const storeSelect = {
    ..._storeSelect,
    storeOptions: params.withStore ? _storeSelect.storeOptions : [],
    setStoreId: (id) => {
      paramsDispatch({ type: "storeId", value: id });
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
    term: debouncedParams.searchTerm,
    storeIds: urlStoreId
      ? [parseInt(urlStoreId, 10)]
      : debouncedParams.storeId === "0" || !debouncedParams.withStore
      ? ""
      : [parseInt(debouncedParams.storeId, 10)],
    statuses:
      debouncedParams.status === "0"
        ? ""
        : [parseInt(debouncedParams.status, 10)],
    roles:
      debouncedParams.role === "0" ? "" : [parseInt(debouncedParams.role, 10)],
    page: debouncedParams.page,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.getUsers({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setPeopleList(data.users);
    }
  });

  const goToPerson = (id) => {
    navigate(`/people/${id}`);
  };

  return {
    roles: [{ id: "0", name: "Any" }, ...roles],
    userStatuses: [{ id: "0", name: "Any" }, ...userStatuses],
    params,
    debouncedParams,
    peopleList,
    prevPage,
    nextPage,
    setStatus,
    setSearchTerm,
    setRole,
    setWithStore,
    storeSelect,
    goToPerson,
  };
};

export const PurePeople = (people) => {
  const {
    roles,
    userStatuses,
    params,
    debouncedParams,
    peopleList,
    prevPage,
    nextPage,
    setStatus,
    setSearchTerm,
    setRole,
    setWithStore,
    storeSelect,
    goToPerson,
  } = people;

  return (
    <div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextInput
            value={params.searchTerm}
            onChange={setSearchTerm}
            placeholder="Enigo Montoya"
            label="Username"
          />
        </div>
        <Select
          label="Role"
          options={roles}
          value={params.role}
          onChange={setRole}
        />
        <Select
          label="Status"
          options={userStatuses}
          value={params.status}
          onChange={setStatus}
        />
        <Checkbox
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
        <ul>
          {peopleList.map((person) => (
            <div key={person.id} onClick={() => goToPerson(person.id)}>
              <p>{person.username}</p>
              <p>{person.emailAddress}</p>
            </div>
          ))}
        </ul>
      </div>
      <PrevNext
        prev={prevPage}
        next={nextPage}
        pageNumber={debouncedParams.page}
      />
    </div>
  );
};

export const useSingleStoreSelect = () => {
  const { accessToken } = useAuth();
  const [storeId, _setStoreId] = useState("");
  const [storeTerm, _setStoreTerm] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);

  const setStoreTerm = (e) => {
    _setStoreTerm(e.target.value);
  };

  const setStoreId = (id) => {
    _setStoreId(id);
    const storeName = storeOptions.find((store) => store.id === id).name;
    _setStoreTerm(storeName);
  };

  const endpointParams = {
    term: storeTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get stores, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.getStores({ params: endpointParams, accessToken }),
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
