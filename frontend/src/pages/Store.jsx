import { useReducer, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useDebounce } from "../components/useDebounce";

export const URL_STORE_ID_KEY = "storeId";

export const Store = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { storeStatuses } = useConstants();
  const { accessToken } = useAuth();
  const [storeInfo, setStoreInfo] = useState({});

  const { error, isLoading } = useSWR(
    !accessToken ? null : `get store ${params.id} using ${accessToken}`,
    () => endpoints.getStore({ id: params.id, accessToken }),
    {
      onSuccess: (data) => {
        setStoreInfo(data);
      },
    },
  );

  const goToStores = () => {
    navigate("/stores");
  };

  const goToPeople = () => {
    navigate(`/people?storeId=${params.id}`);
  };

  // all info (title, email, phone, hours, description, other)
  // can see store code if related to the store
  // button to edit store details
  // button to see tools available from the store
  // button to edit tools in the store
  // button to see users related to the store
  // button to go to returns page
  // button to go to rentals page
  // button to go to stores page

  return (
    <div>
      <Button onClick={() => goToStores()} text="All Stores" />
      <Button onClick={() => goToPeople()} text="People" />
      <h1>{storeInfo.name}</h1>
      <p>{JSON.stringify(storeInfo)}</p>
    </div>
  );
};
