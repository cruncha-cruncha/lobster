import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import useSWR from "swr";
import { useAuth } from "./auth";
import * as endpoints from "../api/endpoints";

const myStores = atom([]);

export const useMyStores = () => {
  const { userId, accessToken } = useAuth();
  const [stores, setStores] = useAtom(myStores);

  const endpointParams = {
    userIds: [userId],
  };

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken || !userId
      ? null
      : `get stores, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchStores({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStores(data.stores);
    }
  }, [data]);

  return {
    stores,
  };
};
