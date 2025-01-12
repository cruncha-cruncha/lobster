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
import { URL_STORE_ID_KEY } from "./Store";

export const StoreCart = () => {
  const params = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { toolCart: _toolCart, addTool, removeTool, inCart } = useToolCart();
  const [userId, _setUserId] = useState("");
  const storeId = params.id;

  const toolCart = _toolCart.filter((tool) => tool.storeId == storeId);

  const goToStoreTools = () => {
    navigate(`/tools?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const goToStore = () => {
    navigate(`/stores/${storeId}`);
  };

  const goToTool = (toolId) => {
    navigate(`/tools/${toolId}`);
  };

  const removeFromCart = (toolId) => {
    removeTool(toolId);
  };

  const setUserId = (e) => {
    _setUserId(e.target.value);
  };

  const canCheckout = toolCart.length > 0 && userId != "";
  const canReturn = toolCart.length > 0 && userId == "";

  const handleCheckout = () => {
    // do something
  };

  const handleReturn = () => {
    // do something
  };

  return (
    <div>
      <h1>Store Cart</h1>
      <div className="flex gap-2">
        <Button onClick={goToStoreTools} text="Store Tools" variant="blue" />
        <Button onClick={goToStore} text="Store" variant="blue" />
      </div>
      <ul>
        {toolCart.map((tool) => (
          <li key={tool.id}>
            <div className="flex justify-between">
              <div onClick={() => goToTool(tool.id)} className="cursor-pointer">
                {tool.realId}, {tool.description}
              </div>
              <Button
                onClick={() => removeFromCart(tool.id)}
                text="Remove"
                variant="red"
              />
            </div>
          </li>
        ))}
        <TextInput label="User ID" value={userId} onChange={setUserId} />
        <div className="flex gap-2">
          <Button text="Return" disabled={!canReturn} onClick={handleReturn} />
          <Button
            text="Checkout"
            disabled={!canCheckout}
            onClick={handleCheckout}
          />
        </div>
      </ul>
    </div>
  );
};
