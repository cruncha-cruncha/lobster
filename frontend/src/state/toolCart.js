import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { atom, useAtom } from "jotai";
import { jwtDecode } from "jwt-decode";

import * as endpoints from "../api/endpoints";

const toolCartAtom = atom([]);

export const useToolCart = () => {
  const [toolCart, setToolCart] = useAtom(toolCartAtom);

  const addTool = (tool) => {
    setToolCart([...toolCart, tool]);
  };

  const removeTool = (toolId) => {
    setToolCart(toolCart.filter((tool) => tool.id != toolId));
  };

  const inCart = (toolId) => {
    return toolCart.some((tool) => tool.id == toolId);
  }

  return { toolCart, addTool, removeTool, inCart };
}