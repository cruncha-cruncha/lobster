import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useToolCart } from "../state/toolCart";
import { URL_STORE_ID_KEY } from "./Store";

export const useStoreCart = () => {
  const params = useParams();
  const { accessToken } = useAuth();
  const {
    toolCart: _toolCart,
    addTool,
    removeTool,
    clear: clearCart,
  } = useToolCart();
  const [userCode, _setUserCode] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const storeId = params.id;

  const toolCart = _toolCart.filter((tool) => tool.storeId == storeId);

  const goToStoreTools = () => `/tools?${URL_STORE_ID_KEY}=${storeId}`;

  const goToStore = () => `/stores/${storeId}`;

  const goToTool = (toolId) => `/tools/${toolId}`;

  const addToCart = (tool) => {
    addTool(tool);
  };

  const removeFromCart = (toolId) => {
    removeTool(toolId);
  };

  const setUserCode = (e) => {
    _setUserCode(e.target.value);
  };

  const canCheckout = toolCart.length > 0 && userCode != "";
  const canReturn = toolCart.length > 0 && userCode == "";

  const handleCheckout = () => {
    setIsCheckingOut(true);
    endpoints
      .checkOutTools({
        info: {
          userCode,
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

  const handleReturn = () => {
    setIsReturning(true);
    endpoints
      .checkInTools({
        info: {
          toolIds: toolCart.map((tool) => Number(tool.id)),
        },
        accessToken,
      })
      .then(() => {
        clearCart();
      })
      .finally(() => {
        setIsReturning(false);
      });
  };

  return {
    storeId,
    goToStoreTools,
    goToStore,
    goToTool,
    toolCart,
    addToCart,
    removeFromCart,
    setUserCode,
    handleCheckout,
    handleReturn,
    canCheckout,
    canReturn,
    userCode,
    isReturning,
    isCheckingOut,
  };
};

export const PureStoreCart = (cart) => {
  const {
    storeId,
    goToStoreTools,
    goToStore,
    goToTool,
    toolCart,
    addToCart,
    removeFromCart,
    setUserCode,
    handleCheckout,
    handleReturn,
    canCheckout,
    canReturn,
    userCode,
    isReturning,
    isCheckingOut,
  } = cart;

  return (
    <div>
      <h1 className="mt-2 px-2 text-xl">Store Cart</h1>
      <div className="mt-2 flex justify-start gap-2 px-2">
        <Button
          goTo={goToStoreTools()}
          text="Store Tools"
          variant="blue"
          size="sm"
        />
        <Button goTo={goToStore()} text="Store" variant="blue" size="sm" />
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <QuickFindStoreTool storeId={storeId} onSingle={addToCart} />
      </div>
      <ul className="border-x-2 border-stone-400 p-2">
        {toolCart.length == 0 && (
          <li className="text-stone-400">Cart is empty</li>
        )}
        {toolCart.map((tool) => (
          <li key={tool.id}>
            <div className="flex items-center justify-between">
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
            </div>
          </li>
        ))}
      </ul>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <TextInput
          id={`store-cart-user-id`}
          label="User ID"
          value={userCode}
          onChange={setUserCode}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2 px-2">
        <Button
          text="Return"
          disabled={!canReturn}
          onClick={handleReturn}
          isLoading={isReturning}
        />
        <Button
          text="Checkout"
          disabled={!canCheckout}
          onClick={handleCheckout}
          isLoading={isCheckingOut}
        />
      </div>
    </div>
  );
};

export const StoreCart = () => {
  const cart = useStoreCart();
  return <PureStoreCart {...cart} />;
};

export const useQuickFindStoreTool = ({ storeId, onSingle }) => {
  const [realId, _setRealId] = useState("");

  const setRealId = (e) => {
    _setRealId(e.target.value);
  };

  const endpointParams = {
    storeId: Number(storeId),
    realId,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !realId
      ? null
      : `get exact real tool, using ${JSON.stringify(endpointParams)}`,
    () => endpoints.getExactRealTool({ params: endpointParams }),
  );

  useEffect(() => {
    if (data) {
      onSingle(data);
      _setRealId("");
    }
  }, [data]);

  return {
    realId,
    setRealId,
  };
};

export const PureQuickFindStoreTool = (quickFindStoreTool) => {
  const { realId, setRealId } = quickFindStoreTool;

  return (
    <>
      <TextInput
        id={`quick-find-real-tool`}
        label="Add Tool by Real ID"
        value={realId}
        onChange={setRealId}
      />
    </>
  );
};

export const QuickFindStoreTool = (params) => {
  const quickFindStoreTool = useQuickFindStoreTool(params);
  return <PureQuickFindStoreTool {...quickFindStoreTool} />;
};
