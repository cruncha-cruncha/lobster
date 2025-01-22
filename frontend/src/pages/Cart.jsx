import { useState } from "react";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Link } from "react-router";
import { TextInput } from "../components/TextInput";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";

export const useCart = () => {
  const { accessToken } = useAuth();
  const { toolCart, removeTool, clear: clearCart } = useToolCart();
  const [storeCode, _setStoreCode] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const goToTools = () => "/tools";

  const goToTool = (toolId) => `/tools/${toolId}`;

  const removeFromCart = (toolId) => {
    removeTool(toolId);
  };

  const setStoreCode = (e) => {
    _setStoreCode(e.target.value);
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
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
      })
      .finally(() => {
        setIsCheckingOut(false);
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
    isCheckingOut,
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
    isCheckingOut,
  } = cart;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h1 className="mr-2 text-xl">Cart</h1>
        <div className="flex justify-start gap-2">
          <Button
            goTo={goToTools()}
            text="All Tools"
            variant="blue"
            size="sm"
          />
        </div>
      </div>
      <ul className="border-x-2 border-stone-400 p-2">
        {toolCart.length == 0 && (
          <li className="text-stone-400">Cart is empty</li>
        )}
        {toolCart.map((tool) => (
          <li key={tool.id} className="flex items-center justify-between">
            <Link to={goToTool(tool.id)} className="cursor-pointer">
              {tool.realId}
              {!tool.shortDescription.trim()
                ? ""
                : `, ${tool.shortDescription}`}
            </Link>
            <Button
              onClick={() => removeFromCart(tool.id)}
              text="Remove"
              variant="red"
              size="sm"
            />
          </li>
        ))}
      </ul>
      {showCheckoutFields && (
        <div className="px-2">
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              id={`cart-store-code`}
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
              isLoading={isCheckingOut}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const Cart = () => {
  const cart = useCart();
  return <PureCart {...cart} />;
};
