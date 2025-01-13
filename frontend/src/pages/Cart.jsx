import { useState } from "react";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useNavigate } from "react-router";
import { TextInput } from "../components/TextInput";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";

export const useCart = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
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
    endpoints
      .checkOutTools({
        info: {
          storeCode,
          toolIds: toolCart.map((tool) => Number(tool.id)),
        },
        accessToken,
      })
      .then(() => {
        clearCart();
      });
  };

  const showCheckoutFields = toolCart.length > 0;
  const canCheckout = toolCart.length > 0 && storeCode != "";

  return {
    goToTools,
    goToTool,
    toolCart,
    removeFromCart,
    setStoreCode,
    handleCheckout,
    showCheckoutFields,
    canCheckout,
    storeCode,
  };
};

export const PureCart = (cart) => {
  const {
    goToTools,
    goToTool,
    toolCart,
    removeFromCart,
    setStoreCode,
    handleCheckout,
    showCheckoutFields,
    canCheckout,
    storeCode,
  } = cart;

  return (
    <div>
      <h1>Cart</h1>
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
            disabled={!canCheckout}
          />
        </>
      )}
    </div>
  );
};

export const Cart = () => {
  const cart = useCart();
  return <PureCart {...cart} />;
};
