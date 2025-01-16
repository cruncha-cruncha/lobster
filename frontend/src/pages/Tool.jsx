import { useEffect, useReducer } from "react";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams, useNavigate } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { URL_STORE_ID_KEY } from "./Store";
import { PureCategorySearch, useCategorySearch } from "./Tools";
import { useToolCart } from "../state/toolCart";
import { eqSet } from "../components/utils";
import { LargeTextInput } from "../components/LargeTextInput";

export const URL_TOOL_ID_KEY = "toolId";

const reducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "shortDescription":
      return { ...state, shortDescription: action.value };
    case "longDescription":
      return { ...state, longDescription: action.value };
    case "realId":
      return { ...state, realId: action.value };
    case "pictures":
      return { ...state, pictures: action.value };
    case "rentalHours":
      return { ...state, rentalHours: action.value };
    case "isLoading":
      return { ...state, isLoading: action.value };
    case "isSaving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const useTool = () => {
  const { accessToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const { toolStatuses } = useConstants();
  const _categorySearch = useCategorySearch();
  const { toolCart, addTool, removeTool } = useToolCart();
  const [info, dispatch] = useReducer(reducer, {
    status: "1",
    shortDescription: "",
    longDescription: "",
    realId: "",
    pictures: [],
    rentalHours: 0,
    isLoading: true,
    isSaving: false,
  });
  const toolId = params.id;

  const updateLocalInfo = (data) => {
    dispatch({ type: "status", value: data.status });
    dispatch({ type: "shortDescription", value: data.shortDescription });
    dispatch({ type: "longDescription", value: data.longDescription || "" });
    data.categories.forEach((category) => {
      _categorySearch.addCategory(category.id);
    });
    dispatch({ type: "realId", value: data.realId });
    dispatch({ type: "pictures", value: data.pictures });
    dispatch({
      type: "rentalHours",
      value: data.rentalHours,
    });
    dispatch({ type: "isLoading", value: false });
  };

  const { data, isLoading, error, mutate } = useSWR(`get tool ${toolId}`, () =>
    endpoints.getTool({ id: toolId }),
  );

  useEffect(() => {
    if (data) {
      updateLocalInfo(data);
    }
  }, [data]);

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

  const setShortDescription = (e) => {
    dispatch({ type: "shortDescription", value: e.target.value });
  };

  const setLongDescription = (e) => {
    dispatch({ type: "longDescription", value: e.target.value });
  };

  const setRealId = (e) => {
    dispatch({ type: "realId", value: e.target.value });
  };

  const setRentalHours = (e) => {
    dispatch({ type: "rentalHours", value: e.target.value });
  };

  const canAddToCart = !toolCart.some((tool) => tool.id == toolId);
  const canRemoveFromCart = toolCart.some((tool) => tool.id == toolId);

  const addToCart = () => {
    addTool(data);
  };

  const removeFromCart = () => {
    removeTool(toolId);
  };

  const updateTool = () => {
    dispatch({ type: "isSaving", value: true });
    return endpoints
      .updateTool({
        id: Number(toolId),
        info: {
          realId: info.realId,
          storeId: Number(data.storeId),
          categoryIds: categorySearch.categories.map((cat) => cat.id),
          shortDescription: info.shortDescription,
          longDescription: info.longDescription,
          rentalHours: parseInt(info.rentalHours, 10) || data.rentalHours,
          pictures: [],
          status: Number(info.status),
        },
        accessToken,
      })
      .then((_data) => {
        mutate();
      })
      .finally(() => {
        dispatch({ type: "isSaving", value: false });
      });
  };

  const categorySearch = {
    ..._categorySearch,
    showMatchAllCats: false,
  };

  const goToRentals = () => {
    navigate(`/rentals?${URL_TOOL_ID_KEY}=${toolId}`);
  };

  const canUpdateTool =
    info.status != data?.status ||
    info.shortDescription != data?.shortDescription ||
    (info.longDescription != data?.longDescription &&
      !(!info.longDescription && !data?.longDescription)) ||
    info.realId != data?.realId ||
    info.rentalHours != data?.rentalHours ||
    !eqSet(
      new Set(categorySearch.categories.map((cat) => cat.id)),
      new Set(data?.categories.map((cat) => cat.id) || []),
    );

  return {
    toolId,
    info,
    data,
    goToTools,
    goToStoreTools,
    goToStore,
    goToRentals,
    toolStatuses,
    setStatus,
    setShortDescription,
    setLongDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
    isSaving: info.isSaving,
    canUpdateTool,
  };
};

export const PureTool = (tool) => {
  const {
    toolId,
    info,
    data,
    goToTools,
    goToStoreTools,
    goToStore,
    goToRentals,
    toolStatuses,
    setStatus,
    setShortDescription,
    setLongDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
    isSaving,
    canUpdateTool,
  } = tool;

  return (
    <div>
      <h2 className="mt-2 px-2 text-xl">{data?.realId || "Tool"}</h2>
      <div className="my-2 flex gap-2 px-2">
        <Button text="All Tools" onClick={goToTools} variant="blue" size="sm" />
        <Button
          text="Store Tools"
          onClick={goToStoreTools}
          variant="blue"
          size="sm"
        />
        <Button text="Rentals" onClick={goToRentals} variant="blue" size="sm" />
        <Button text="Store" onClick={goToStore} variant="blue" size="sm" />
      </div>
      <p className="px-2">{JSON.stringify(data)}</p>
      <div className="flex justify-end gap-2 px-2">
        {canAddToCart && (
          <Button text="Add to Cart" onClick={() => addToCart(toolId)} />
        )}
        {canRemoveFromCart && (
          <Button
            text="Remove from Cart"
            onClick={() => removeFromCart(toolId)}
            variant="red"
          />
        )}
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
        <TextInput
          label="Short Description"
          value={info.shortDescription}
          onChange={setShortDescription}
        />
        <TextInput label="Real ID" value={info.realId} onChange={setRealId} />
        <div className="md:col-span-2">
          <LargeTextInput
            label="Long Description"
            value={info.longDescription}
            onChange={setLongDescription}
          />
        </div>
        <div className="md:col-span-2">
          <PureCategorySearch {...categorySearch} />
        </div>
        <TextInput
          label="Rental Hours"
          value={info.rentalHours || ""}
          onChange={setRentalHours}
        />
        <Select
          label="Status"
          value={info.status}
          options={toolStatuses}
          onChange={setStatus}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2 px-2">
        <Button
          text="Update"
          onClick={updateTool}
          isLoading={isSaving}
          disabled={!canUpdateTool}
        />
      </div>
    </div>
  );
};

export const Tool = () => {
  const tool = useTool();
  return <PureTool {...tool} />;
};
