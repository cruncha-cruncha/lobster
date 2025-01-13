import { useReducer, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useDebounce } from "../components/useDebounce";
import { PrevNext } from "../components/PrevNext";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "page":
      return { ...state, page: action.value };
    case "status":
      return { ...state, status: action.value, page: 1 };
    case "term":
      return { ...state, term: action.value, page: 1 };
    default:
      return state;
  }
};

export const useStores = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { storeStatuses } = useConstants();

  const [storeList, setStoreList] = useState([]);
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    page: 1,
    status: "1",
    term: "",
  });

  const goToNewStore = async () => {
    navigate("/stores/new");
  };

  const goToStore = (id) => {
    navigate(`/stores/${id}`);
  };

  const prevPage = () => {
    if (params.page > 1) {
      paramsDispatch({ type: "page", value: params.page - 1 });
    }
  };

  const nextPage = () =>
    paramsDispatch({ type: "page", value: params.page + 1 });

  const setStatus = (e) =>
    paramsDispatch({ type: "status", value: e.target.value });

  const setTerm = (e) =>
    paramsDispatch({ type: "term", value: e.target.value });

  const debouncedParams = useDebounce(params, 200);

  const endpointParams = {
    term: debouncedParams.term,
    page: debouncedParams.page,
    statuses:
      debouncedParams.status == "0"
        ? ""
        : [parseInt(debouncedParams.status, 10)],
  };

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get stores, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchStores({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStoreList(data.stores);
    }
  }, [data]);

  return {
    storeList,
    storeStatuses: [{ id: "0", name: "Any" }, ...storeStatuses],
    params,
    debouncedParams,
    goToNewStore,
    goToStore,
    prevPage,
    nextPage,
    setStatus,
    setTerm,
  };
};

export const PureStores = (stores) => {
  const {
    goToNewStore,
    goToStore,
    prevPage,
    nextPage,
    params,
    debouncedParams,
    setTerm,
    setStatus,
    storeStatuses,
    storeList,
  } = stores;

  return (
    <div>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={goToNewStore}
          text="New Store"
          variant="blue"
          size="sm"
        />
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
        <TextInput
          value={params.term}
          onChange={setTerm}
          placeholder="Some Store"
          label="Store Name"
        />
        <Select
          label="Status"
          options={storeStatuses}
          value={params.status}
          onChange={setStatus}
        />
      </div>
      <div>
        <ul className="mb-3">
          {storeList.map((store) => (
            <li
              key={store.id}
              onClick={() => goToStore(store.id)}
              className="mb-2 cursor-pointer"
            >
              <p>
                {store.name}, {store.location || "no location"}
              </p>
            </li>
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

export const Stores = (props) => {
  const stores = useStores(props);
  return <PureStores {...stores} />;
};
