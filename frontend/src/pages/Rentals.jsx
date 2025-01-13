import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useNavigate, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { URL_STORE_ID_KEY } from "./Store";
import { useToolCategories } from "../state/toolCategories";
import { PrevNext } from "../components/PrevNext";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";

export const Rentals = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);
  const { toolCart, removeTool, clear: clearCart } = useToolCart();
  const [storeCode, _setStoreCode] = useState("");

  const goToTools = () => {
    navigate("/tools");
  };

  const goToTool = (toolId) => {
    navigate(`/tools/${toolId}`);
  };

  const removeFromCart = (toolId) => {
    removeTool(toolId);
  };

  const setStoreCode = (e) => {
    _setStoreCode(e.target.value);
  };

    const handleCheckout = () => {
      endpoints.checkOutTools({
        info: {
          storeCode,
          toolIds: toolCart.map((tool) => Number(tool.id)),
        },
        accessToken
      }).then(() => {
        clearCart();
      });
    };

  const showCheckoutFields = toolCart.length > 0;
  const canCheckout = toolCart.length > 0 && storeCode != "";

  return (
    <div>
      <h1>Rentals</h1>
      <Button onClick={goToTools} text="All Tools" />
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
      </ul>
      {showCheckoutFields && (
        <>
          <TextInput
            label="Store Code"
            value={storeCode}
            onChange={setStoreCode}
          />
          <Button
            onClick={handleCheckout}
            text="Checkout"
            disabled={canCheckout}
          />
        </>
      )}
    </div>
  );
};
