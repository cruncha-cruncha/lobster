import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

const rolesAtom = atom([]);

export const useRoles = () => {
  const [roles, setRoles] = useAtom(rolesAtom);

  //   const { error, isLoading } = useSWR(
  //     "get role options",
  //     endpoints.getRoleOptions,
  //     {
  //       revalidateOnFocus: false,
  //       keepPreviousData: true,
  //       onSuccess: (data) => {
  //         setRoles(data);
  //       },
  //     },
  //   );

  return {
    error,
    isLoading,
    roles,
  };
};
