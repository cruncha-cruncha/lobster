import { useState, useEffect, useReducer } from "react";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams, useNavigate } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { Button } from "../components/Button";
import { URL_STORE_ID_KEY } from "./Store";
import { PureCategorySearch, useCategorySearch } from "./Tools";

const reducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "description":
      return { ...state, description: action.value };
    case "realId":
      return { ...state, realId: action.value };
    case "pictures":
      return { ...state, pictures: action.value };
    case "defaultRentalPeriod":
      return { ...state, defaultRentalPeriod: action.value };
    case "isLoading":
      return { ...state, isLoading: action.value };
    case "isSaving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const Tool = () => {
  const { accessToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const { toolStatuses } = useConstants();
  const _categorySearch = useCategorySearch();
  const [data, setData] = useState({});
  const [info, dispatch] = useReducer(reducer, {
    status: "1",
    description: "",
    realId: "",
    pictures: [],
    defaultRentalPeriod: 0,
    isLoading: true,
    isSaving: false,
  });
  const toolId = params.id;

  const updateLocalInfo = (data) => {
    setData(data);
    dispatch({ type: "status", value: data.status });
    dispatch({ type: "description", value: data.description });
    data.categories.forEach((category) => {
      _categorySearch.addCategory(category.id);
    });
    dispatch({ type: "realId", value: data.realId });
    dispatch({ type: "pictures", value: data.pictures });
    dispatch({
      type: "defaultRentalPeriod",
      value: data.defaultRentalPeriod,
    });
    dispatch({ type: "isLoading", value: false });
  };

  const getData = () => {
    if (!accessToken) return;
    endpoints.getTool({ id: toolId, accessToken }).then(updateLocalInfo);
  };

  useEffect(() => {
    getData();
  }, [accessToken]);

  const goToTools = () => {
    navigate("/tools");
  };

  const goToStoreTools = () => {
    navigate(`/tools?${URL_STORE_ID_KEY}=${data.storeId}`);
  };

  const goToStore = () => {
    navigate(`/stores/${data.storeId}`);
  };

  const setStatus = (e) => {
    dispatch({ type: "status", value: e.target.value });
  };

  const setDescription = (e) => {
    dispatch({ type: "description", value: e.target.value });
  };

  const setRealId = (e) => {
    dispatch({ type: "realId", value: e.target.value });
  };

  const setDefaultRentalPeriod = (e) => {
    dispatch({ type: "defaultRentalPeriod", value: e.target.value });
  };

  const updateTool = () => {
    return endpoints
      .updateTool({
        id: Number(toolId),
        info: {
          realId: info.realId,
          storeId: Number(data.storeId),
          categoryIds: categorySearch.categories.map((cat) => cat.id),
          description: info.description,
          defaultRentalPeriod:
            parseInt(info.defaultRentalPeriod, 10) || undefined,
          pictures: [],
          status: Number(info.status),
        },
        accessToken,
      })
      .then(updateLocalInfo);
  };

  const categorySearch = {
    ..._categorySearch,
    showMatchAllCats: false,
  };

  return (
    <div>
      <p>Tool</p>
      <div className="flex gap-2">
        <Button text="Store" onClick={goToStore} variant="blue" />
        <Button text="Store Tools" onClick={goToStoreTools} variant="blue"  />
        <Button text="All Tools" onClick={goToTools} variant="blue" />
      </div>

      <p>{JSON.stringify(data)}</p>
      <Select
        label="Status"
        value={info.status}
        options={toolStatuses}
        onChange={setStatus}
      />
      <TextInput
        label="Description"
        value={info.description}
        onChange={setDescription}
      />
      <TextInput label="Real ID" value={info.realId} onChange={setRealId} />
      <TextInput
        label="Default Rental Period"
        value={info.defaultRentalPeriod || ""}
        onChange={setDefaultRentalPeriod}
      />
      <PureCategorySearch {...categorySearch} />
      <Button text="Update" onClick={updateTool} />
    </div>
  );
};
