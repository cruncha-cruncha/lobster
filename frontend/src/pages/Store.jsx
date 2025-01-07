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
  const { accessToken, permissions } = useAuth();
  const [storeInfo, setStoreInfo] = useState({});
  const [status, _setStatus] = useState(0);

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get store ${params.id} using ${accessToken}`,
    () => endpoints.getStore({ id: params.id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStoreInfo(data);
      _setStatus((prev) => (prev === 0 ? data.status : prev));
    }
  }, [data]);

  const goToStores = () => {
    navigate("/stores");
  };

  const goToPeople = () => {
    navigate(`/people?storeId=${params.id}`);
  };

  const showUpdateStatus = permissions.isStoreAdmin();

  const canUpdateStatus = storeInfo.status != status;

  const updateStatus = () => {
    endpoints
      .updateStoreStatus({
        id: params.id,
        status: Number(status),
        accessToken,
      })
      .then((data) => {
        setStoreInfo(data);
      });
  };

  const setStatus = (e) => {
    _setStatus(e.target.value);
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
      {showUpdateStatus && (
        <>
          <Select options={storeStatuses} value={status} onChange={setStatus} />
          <Button
            onClick={() => updateStatus()}
            text="Update Status"
            disabled={!canUpdateStatus}
          />
        </>
      )}
    </div>
  );
};
