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
import { usePrevNext, PurePrevNext } from "../components/PrevNext";

const paramsReducer = (state, action) => {
  switch (action.type) {
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
  const pageControl = usePrevNext();
  const [storeList, setStoreList] = useState([]);
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    status: "1",
    term: "",
  });

  const goToNewStore = async () => {
    navigate("/stores/new");
  };

  const goToStore = (id) => {
    navigate(`/stores/${id}`);
  };

  const setStatus = (e) =>
    paramsDispatch({ type: "status", value: e.target.value });

  const setTerm = (e) =>
    paramsDispatch({ type: "term", value: e.target.value });

  const debouncedTerm = useDebounce(params.term, 400);

  const endpointParams = {
    term: debouncedTerm,
    page: pageControl.pageNumber,
    statuses:
      params.status == "0"
        ? ""
        : [parseInt(params.status, 10)],
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

  return {
    storeList,
    storeStatuses: [{ id: "0", name: "Any" }, ...storeStatuses],
    params,
    goToNewStore,
    goToStore,
    setStatus,
    setTerm,
    pageControl,
  };
};

export const PureStores = (stores) => {
  const {
    goToNewStore,
    goToStore,
    params,
    setTerm,
    setStatus,
    storeStatuses,
    storeList,
    pageControl,
  } = stores;

  return (
    <div>
      <div className="mt-2 flex items-center gap-2 px-2">
        <h2 className="mr-2 text-xl">Stores</h2>
        <div className="flex gap-2">
          <Button
            onClick={goToNewStore}
            text="New Store"
            variant="blue"
            size="sm"
          />
        </div>
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
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
        <ul className="mb-3 mt-4 border-x-2 border-stone-400 px-2">
          {storeList.length == 0 && (
            <li className="text-stone-400">no results</li>
          )}
          {storeList.map((store) => (
            <li
              key={store.id}
              onClick={() => goToStore(store.id)}
              className="mb-2 cursor-pointer"
            >
              <p>
                {store.name},{" "}
                {store.location.trim() ? (
                  store.location
                ) : (
                  <span className="text-stone-400">no location</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <PurePrevNext {...pageControl} />
    </div>
  );
};

export const Stores = (props) => {
  const stores = useStores(props);
  return <PureStores {...stores} />;
};
