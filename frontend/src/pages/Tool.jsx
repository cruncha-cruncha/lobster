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

const reducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "description":
      return { ...state, description: action.value };
    case "categories":
      return { ...state, categories: action.value };
    case "realId":
      return { ...state, realId: action.value };
    case "pictures":
      return { ...state, pictures: action.value };
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
  const [info, dispatch] = useReducer(reducer, {
    status: "1",
    description: "",
    categories: [],
    realId: "",
    pictures: [],
    isLoading: true,
    isSaving: false,
  });
  const toolId = params.id;

  const { data, isLoading, isError } = useSWR(
    !accessToken ? null : `get tool ${toolId} using accessToken ${accessToken}`,
    () => endpoints.getTool({ id: toolId, accessToken }),
  );

  useEffect(() => {
    if (data) {
      dispatch({ type: "status", value: data.status });
      dispatch({ type: "description", value: data.description });
      dispatch({ type: "categories", value: data.categories });
      dispatch({ type: "realId", value: data.realId });
      dispatch({ type: "pictures", value: data.pictures });
      dispatch({ type: "isLoading", value: false });
    }
  }, [data]);

  const goToTools = () => {
    navigate("/tools");
  };

  const goToStoreTools = () => {
    navigate(`/stores/${data.storeId}/tools`);
  }

  return (
    <div>
      <p>Tool</p>
      <Button text="All Tools" onClick={goToTools} />
      <Button text="Store Tools" onClick={goToStoreTools} />
      <p>{JSON.stringify(info)}</p>
    </div>
  );
};
