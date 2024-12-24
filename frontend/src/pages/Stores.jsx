import { useReducer, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useDebounce } from "../components/useDebounce";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "page":
      return { ...state, page: action.value };
    case "status":
      return { ...state, status: action.value };
    case "name":
      return { ...state, name: action.value };
    default:
      return state;
  }
};

export const useStores = () => {
  const navigate = useNavigate();
  const { storeStatuses } = useConstants();
  const { accessToken } = useAuth();

  const [stores, setStores] = useState([]);
  const [params, dispatch] = useReducer(paramsReducer, {
    page: 1,
    status: "0",
    name: "",
  });

  const goToNewStore = async () => {
    navigate("/stores/new");
  };

  const goToStore = (id) => {
    // go to a store
  };

  const prevPage = () => {
    if (params.page > 1) {
      dispatch({ type: "page", value: params.page - 1 });
    }
  };
  const nextPage = () => dispatch({ type: "page", value: params.page + 1 });
  const setStatus = (e) => dispatch({ type: "status", value: e.target.value });
  const setName = (e) => dispatch({ type: "name", value: e.target.value });

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
          name: params.name,
        },
        accessToken,
      })
      .then((data) => {
        setStores(data.stores);
      });
  }, [params, debouncedParams, accessToken]);

  return {
    stores,
    storeStatuses,
    params,
    debouncedParams,
    goToNewStore,
    goToStore,
    prevPage,
    nextPage,
    setStatus,
    setName,
  };
};

export const PureStores = (stores) => {
  return (
    <div>
      <h1>Stores</h1>
      <Button
        onClick={(e) => stores?.goToNewStore?.(e)}
        variant="blue"
        text="New Store"
      />
      <TextInput
        value={stores?.params?.name}
        onChange={(e) => stores?.setName?.(e)}
        placeholder="Some Store"
        label="Store Name"
      />
      <label>Status</label>
      <select
        onChange={(e) => stores?.setStatus?.(e)}
        value={stores?.params?.status}
      >
        <option value="0">any</option>
        {(stores?.storeStatuses || []).map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
      <div>
        <ul>
          {(stores?.stores || []).map((store) => (
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
      <div className="flex">
        <Button
          onClick={(e) => stores?.prevPage?.(e)}
          variant="blue"
          text="Previous"
        />
        <span>Page {stores?.debouncedParams?.page}</span>
        <Button
          onClick={(e) => stores?.nextPage?.(e)}
          variant="blue"
          text="Next"
        />
      </div>
    </div>
  );
};

export const Stores = (props) => {
  const stores = useStores(props);
  return <PureStores {...stores} />;
};
