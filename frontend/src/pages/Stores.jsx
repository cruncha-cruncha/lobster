import { useReducer, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
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
  const navigate = useNavigate();
  const { storeStatuses } = useConstants();
  const { accessToken } = useAuth();

  const [storeList, setStoreList] = useState([]);
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    page: 1,
    status: "0",
    term: "",
  });

  const goToNewStore = async () => {
    navigate("/stores/new");
  };

  const goToStore = (id) => {
    // go to a store
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

  useEffect(() => {
    if (JSON.stringify(params) !== JSON.stringify(debouncedParams)) {
      return;
    }

    endpoints
      .getStores({
        params: {
          page: params.page,
          statuses: params.status === "0" ? "" : [parseInt(params.status, 10)],
          term: params.term,
        },
        accessToken,
      })
      .then((data) => {
        setStoreList(data.stores);
      });
  }, [params, debouncedParams, accessToken]);

  return {
    storeList,
    storeStatuses: [...storeStatuses, { id: "0", name: "Any" }],
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
      <h1>Stores</h1>
      <Button onClick={goToNewStore} variant="blue" text="New Store" />
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
      <div>
        <ul>
          {storeList.map((store) => (
            <li key={store.id} onClick={() => stores?.goToStore?.(store.id)}>
              <h2>{store.name}</h2>
              <p>{store.location}</p>
              <p>{store.hours}</p>
              <p>{store.contact}</p>
              <p>{store.description}</p>
              <p>{store.status}</p>
              <p>{store.createdAt}</p>
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
