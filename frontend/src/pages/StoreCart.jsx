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
import { SearchSelect } from "../components/SearchSelect";

export const useStoreCart = () => {
  const params = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const {
    toolCart: _toolCart,
    addTool,
    removeTool,
    clear: clearCart,
  } = useToolCart();
  const [userCode, _setUserCode] = useState("");
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
      });
  };

  const handleReturn = () => {
    endpoints
      .checkInTools({
        info: {
          toolIds: toolCart.map((tool) => Number(tool.id)),
        },
        accessToken,
      })
      .then(() => {
        clearCart();
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
  } = cart;

  return (
    <div>
      <div className="mt-2 flex justify-start gap-2">
        <Button
          onClick={goToStoreTools}
          text="Store Tools"
          variant="blue"
          size="sm"
        />
        <Button onClick={goToStore} text="Store" variant="blue" size="sm" />
      </div>
      <QuickFindStoreTool storeId={storeId} onSingle={addToCart} />
      <h1>Store Cart</h1>
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
                size="sm"
              />
            </div>
          </li>
        ))}
        <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
          <TextInput label="User ID" value={userCode} onChange={setUserCode} />
        </div>
        <div className="mt-3 flex justify-end gap-2">
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
    term: realId,
    storeIds: [Number(storeId)],
  };

  const { data, isLoading, error, mutate } = useSWR(
    `get tools, using ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchTools({ params: endpointParams }),
  );

  const toolOptions = (() => {
    if (!realId || !data || data.length <= 1) {
      return [];
    }

    return data.tools.map((tool) => ({
      id: tool.id,
      name: `${tool.realId}, ${tool.description}`,
    }));
  })();

  useEffect(() => {
    if (data && data.tools.length == 1) {
      onSingle(data.tools[0]);
      _setRealId("");
    }
  }, [data?.tools]);

  const handleSelect = (toolId) => {
    const tool = data.tools.find((t) => t.id == toolId);
    onSingle(tool);
    _setRealId("");
  };

  return {
    realId,
    setRealId,
    toolOptions,
    handleSelect,
  };
};

export const PureQuickFindStoreTool = (quickFindStoreTool) => {
  const { realId, setRealId, toolOptions, handleSelect } = quickFindStoreTool;

  return (
    <>
      <SearchSelect
        label="Add Tool By Real ID"
        value={realId}
        onChange={setRealId}
        onSelect={handleSelect}
        options={toolOptions}
        showLastSelected={false}
      />
    </>
  );
};

export const QuickFindStoreTool = (params) => {
  const quickFindStoreTool = useQuickFindStoreTool(params);
  return <PureQuickFindStoreTool {...quickFindStoreTool} />;
};
