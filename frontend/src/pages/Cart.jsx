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
      <div className="my-2 flex items-center gap-2">
        <h1 className="mr-2 text-xl">Cart</h1>
        <div className="flex justify-start gap-2">
          <Button
            onClick={goToTools}
            text="All Tools"
            variant="blue"
            size="sm"
          />
        </div>
      </div>
      <ul className="border-x-2 border-stone-400 p-2">
      {toolCart.length == 0 && (
          <li className="text-stone-400">Cart is Empty</li>
        )}
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
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
      {showCheckoutFields && (
        <>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              label="Store Code"
              value={storeCode}
              onChange={setStoreCode}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              onClick={handleCheckout}
              text="Checkout"
              disabled={!canCheckout}
            />
          </div>
        </>
      )}
    </div>
  );
};

export const Cart = () => {
  const cart = useCart();
  return <PureCart {...cart} />;
};
