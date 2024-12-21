import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

// aka roles and statuses

const rolesAtom = atom([]);
const storeStatusesAtom = atom([]);
const usersStatusesAtom = atom([]);
const toolsStatusesAtom = atom([]);
const rentalsStatusesAtom = atom([]);
const grievancesStatusesAtom = atom([]);
const permissionsStatusesAtom = atom([]);

export const useInitConstants = () => {
  const [roles, setRoles] = useAtom(rolesAtom);
  const [storeStatuses, setStoreStatuses] = useAtom(storeStatusesAtom);
  const [usersStatuses, setUsersStatuses] = useAtom(usersStatusesAtom);
  const [toolsStatuses, setToolsStatuses] = useAtom(toolsStatusesAtom);
  const [rentalsStatuses, setRentalsStatuses] = useAtom(rentalsStatusesAtom);
  const [grievancesStatuses, setGrievancesStatuses] = useAtom(
    grievancesStatusesAtom,
  );
  const [permissionsStatuses, setPermissionsStatuses] = useAtom(
    permissionsStatusesAtom,
  );

  useSWR("get all status options", endpoints.getAllStatusOptions, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      setStoreStatuses(data.stores);
      setUsersStatuses(data.users);
      setToolsStatuses(data.tools);
      setRentalsStatuses(data.rentals);
      setGrievancesStatuses(data.grievances);
      setPermissionsStatuses(data.permissions);
    },
  });

  useSWR("get role options", endpoints.getRoleOptions, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      setRoles(data.roles);
    },
  });
};

export const useConstants = () => {
  const [roles, setRoles] = useAtom(rolesAtom);
  const [storeStatuses, setStoreStatuses] = useAtom(storeStatusesAtom);
  const [usersStatuses, setUsersStatuses] = useAtom(usersStatusesAtom);
  const [toolsStatuses, setToolsStatuses] = useAtom(toolsStatusesAtom);
  const [rentalsStatuses, setRentalsStatuses] = useAtom(rentalsStatusesAtom);
  const [grievancesStatuses, setGrievancesStatuses] = useAtom(
    grievancesStatusesAtom,
  );
  const [permissionsStatuses, setPermissionsStatuses] = useAtom(
    permissionsStatusesAtom,
  );

  const refresh = () => {
    Promise.all(
      endpoints.getRoleOptions(),
      endpoints.getAllStatusOptions(),
    ).then(([rolesData, statusData]) => {
      setRoles(rolesData.roles);
      setStoreStatuses(statusData.stores);
      setUsersStatuses(statusData.users);
      setToolsStatuses(statusData.tools);
      setRentalsStatuses(statusData.rentals);
      setGrievancesStatuses(statusData.grievances);
      setPermissionsStatuses(statusData.permissions);
    });
  };

  return {
    error,
    isLoading,
    refresh,
    roles,
    storeStatuses,
    usersStatuses,
    toolsStatuses,
    rentalsStatuses,
    grievancesStatuses,
    permissionsStatuses,
  };
};
