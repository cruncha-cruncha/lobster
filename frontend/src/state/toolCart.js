import { atom, useAtom } from "jotai";

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

  const clear = () => {
    setToolCart([]);
  };

  return { toolCart, addTool, removeTool, clear, inCart };
}