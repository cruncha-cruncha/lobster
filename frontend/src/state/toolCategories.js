import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";
import { useAuth } from "./auth";

const toolCategoriesAtom = atom([]);

export const useInitToolCategories = () => {
  const [toolCategories, setToolCategories] = useAtom(toolCategoriesAtom);

  const { data, isLoading, error } = useSWR(
    `get all tool categories`,
    () => endpoints.getAllToolCategories(),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (data) {
      setToolCategories(data.categories);
    }
  }, [data]);
};

export const useToolCategories = () => {
  const [toolCategories, setToolCategories] = useAtom(toolCategoriesAtom);

  const refresh = () => {
    endpoints.getAllToolCategories().then((data) => {
      setToolCategories(data.categories);
    });
  };

  return {
    refresh,
    toolCategories,
  };
};
