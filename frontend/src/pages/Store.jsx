import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useCategorySearch, PureCategorySearch } from "./Tools";
import { useToolCart } from "../state/toolCart";

export const URL_STORE_ID_KEY = "storeId";

export const useStore = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { storeStatuses } = useConstants();
  const { toolCart } = useToolCart();
  const { accessToken, permissions } = useAuth();
  const [storeInfo, setStoreInfo] = useState({});
  const [status, _setStatus] = useState(0);
  const addTool = useAddTool({ storeId: params.id });
  const storeId = params.id;

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get store ${storeId}, using ${accessToken}`,
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

  const cartSize = toolCart.filter((tool) => tool.storeId == storeId).length;
  const goToCart = () => {
    navigate(`/stores/${storeId}/cart`);
  };

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

  return {
    storeInfo,
    storeStatuses,
    status,
    setStatus,
    showUpdateStatus,
    canUpdateStatus,
    goToStores,
    goToPeople,
    goToTools,
    updateStatus,
    addTool,
    goToCart,
    cartSize,
  };
};

export const PureStore = (store) => {
  const {
    storeInfo,
    storeStatuses,
    status,
    setStatus,
    showUpdateStatus,
    canUpdateStatus,
    goToStores,
    goToPeople,
    goToTools,
    updateStatus,
    addTool,
    goToCart,
    cartSize,
  } = store;

  return (
    <div>
      <div className="flex gap-2">
        <Button onClick={() => goToTools()} text="Tools" variant="blue" />
        <Button onClick={() => goToPeople()} text="People" variant="blue" />
        <Button onClick={() => goToStores()} text="All Stores" variant="blue" />
        <Button onClick={goToCart} text={`Cart (${cartSize})`} variant="blue" />
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
  const defaultRentalHours = 48;
  const { accessToken } = useAuth();
  const [realId, _setRealId] = useState("");
  const [description, _setDescription] = useState("");
  const [rentalHours, _setRentalHours] = useState(defaultRentalHours);
  const categorySearch = useCategorySearch();

  // rental hours
  // pictures

  const setRealId = (e) => {
    _setRealId(e.target.value);
  };

  const setDescription = (e) => {
    _setDescription(e.target.value);
  };

  const setRentalHours = (e) => {
    _setRentalHours(val);
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
          rentalHours: parseInt(rentalHours, 10) || defaultRentalHours,
          pictures: [],
          status: 1,
        },
        accessToken,
      })
      .then((data) => {
        console.log(data);
        // do something? success message? clear fields? navigate to tool? button to go to tool?
      });
  };

  return {
    realId,
    setRealId,
    description,
    setDescription,
    rentalHours,
    setRentalHours,
    defaultRentalHours,
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
    rentalHours,
    setRentalHours,
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
        label="Rental Hours"
        value={rentalHours}
        onChange={setRentalHours}
        placeholder={`${defaultRentalHours}`}
      />
      <PureCategorySearch {...categorySearch} />
      <Button onClick={createTool} text="Add Tool" disabled={!canAddTool} />
    </div>
  );
};

export const Store = () => {
  const store = useStore();
  return <PureStore {...store} />;
};
