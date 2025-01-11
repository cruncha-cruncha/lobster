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
import { useCategorySearch, PureCategorySearch } from "./Tools";

export const URL_STORE_ID_KEY = "storeId";

export const Store = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { storeStatuses } = useConstants();
  const { accessToken, permissions } = useAuth();
  const [storeInfo, setStoreInfo] = useState({});
  const [status, _setStatus] = useState(0);
  const addTool = useAddTool({ storeId: params.id });
  const storeId = params.id;

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get store ${storeId} using ${accessToken}`,
    () => endpoints.getStore({ id: storeId, accessToken }),
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
    navigate(`/people?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const goToTools = () => {
    navigate(`/tools?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const showUpdateStatus = permissions.isStoreAdmin();

  const canUpdateStatus = storeInfo.status != status;

  const updateStatus = () => {
    endpoints
      .updateStoreStatus({
        id: storeId,
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

  // button to edit store details
  // button to go to returns page
  // button to go to rentals page

  return (
    <div>
      <div className="flex gap-2">
        <Button onClick={() => goToTools()} text="Tools" variant="blue" />
        <Button onClick={() => goToPeople()} text="People" variant="blue" />
        <Button onClick={() => goToStores()} text="All Stores" variant="blue" />
      </div>
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
      <PureAddTool {...addTool} />
    </div>
  );
};

export const useAddTool = ({ storeId }) => {
  const { accessToken } = useAuth();
  const [realId, _setRealId] = useState("");
  const [description, _setDescription] = useState("");
  const [defaultRentalPeriod, _setDefaultRentalPeriod] = useState(7);
  const categorySearch = useCategorySearch();

  // default rental period
  // pictures

  const setRealId = (e) => {
    _setRealId(e.target.value);
  };

  const setDescription = (e) => {
    _setDescription(e.target.value);
  };

  const setDefaultRentalPeriod = (e) => {
    _setDefaultRentalPeriod(val);
  };

  // const showAddTool = if user is tool manager for store

  const canAddTool = true;
  // realId !== "" && description !== "" && categories.length > 0;

  const createTool = () => {
    return endpoints
      .createTool({
        info: {
          realId,
          storeId: Number(storeId),
          categoryIds: [],
          description,
          defaultRentalPeriod: parseInt(defaultRentalPeriod, 10) || undefined,
          pictures: [],
          status: 1,
        },
        accessToken,
      })
      .then((data) => {
        console.log(data);
      });
  };

  return {
    realId,
    setRealId,
    description,
    setDescription,
    defaultRentalPeriod,
    setDefaultRentalPeriod,
    categorySearch: {
      ...categorySearch,
      showMatchAllCats: false,
    },
    createTool,
    canAddTool,
  };
};

export const PureAddTool = (addTool) => {
  const {
    realId,
    setRealId,
    description,
    setDescription,
    defaultRentalPeriod,
    setDefaultRentalPeriod,
    categorySearch,
    createTool,
    canAddTool,
  } = addTool;

  return (
    <div>
      <p>New Tool</p>
      <TextInput
        label="Real ID"
        value={realId}
        onChange={setRealId}
        placeholder="X5J2"
      />
      <TextInput
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="A red screw driver, square head"
      />
      <TextInput
        label="Default Rental Period"
        value={defaultRentalPeriod}
        onChange={setDefaultRentalPeriod}
        placeholder="days"
      />
      <PureCategorySearch {...categorySearch} />
      <Button onClick={createTool} text="Add Tool" disabled={!canAddTool} />
    </div>
  );
};
