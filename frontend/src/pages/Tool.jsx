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

export const URL_TOOL_ID_KEY = "toolId";

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
    description: "",
    realId: "",
    pictures: [],
    rentalHours: 0,
    isLoading: true,
    isSaving: false,
  });
  const toolId = params.id;

  const updateLocalInfo = (data) => {
    dispatch({ type: "status", value: data.status });
    dispatch({ type: "description", value: data.description });
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

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken ? null : `get tool ${toolId}, using ${accessToken}`,
    () => endpoints.getTool({ id: toolId, accessToken }),
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

  const setDescription = (e) => {
    dispatch({ type: "description", value: e.target.value });
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
    return endpoints
      .updateTool({
        id: Number(toolId),
        info: {
          realId: info.realId,
          storeId: Number(data.storeId),
          categoryIds: categorySearch.categories.map((cat) => cat.id),
          description: info.description,
          rentalHours: parseInt(info.rentalHours, 10) || data.rentalHours,
          pictures: [],
          status: Number(info.status),
        },
        accessToken,
      })
      .then((_data) => {
        mutate();
      });
  };

  const categorySearch = {
    ..._categorySearch,
    showMatchAllCats: false,
  };

  return {
    toolId,
    info,
    data,
    goToTools,
    goToStoreTools,
    goToStore,
    toolStatuses,
    setStatus,
    setDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
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
    toolStatuses,
    setStatus,
    setDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
  } = tool;

  return (
    <div>
      <p>Tool</p>
      <div className="flex gap-2">
        <Button text="Store" onClick={goToStore} variant="blue" />
        <Button text="Store Tools" onClick={goToStoreTools} variant="blue" />
        <Button text="All Tools" onClick={goToTools} variant="blue" />
      </div>
      <p>{JSON.stringify(data)}</p>
      <div className="flex justify-end gap-2">
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
        label="Rental Hours"
        value={info.rentalHours || ""}
        onChange={setRentalHours}
      />
      <PureCategorySearch {...categorySearch} />
      <div className="flex justify-end gap-2">
        <Button text="Update" onClick={updateTool} />
      </div>
    </div>
  );
};

export const Tool = () => {
  const tool = useTool();
  return <PureTool {...tool} />;
};
