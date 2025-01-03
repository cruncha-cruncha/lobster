import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

// aka roles and statuses

const rolesAtom = atom([]);
const storeStatusesAtom = atom([]);
const userStatusesAtom = atom([]);
const toolStatusesAtom = atom([]);
const rentalStatusesAtom = atom([]);
const grievanceStatusesAtom = atom([]);
const permissionStatusesAtom = atom([]);

export const useInitConstants = () => {
  const [roles, setRoles] = useAtom(rolesAtom);
  const [storeStatuses, setStoreStatuses] = useAtom(storeStatusesAtom);
  const [userStatuses, setUserStatuses] = useAtom(userStatusesAtom);
  const [toolStatuses, setToolStatuses] = useAtom(toolStatusesAtom);
  const [rentalStatuses, setRentalStatuses] = useAtom(rentalStatusesAtom);
  const [grievanceStatuses, setGrievanceStatuses] = useAtom(
    grievanceStatusesAtom,
  );
  const [permissionStatuses, setPermissionStatuses] = useAtom(
    permissionStatusesAtom,
  );

  useSWR("get all status options", endpoints.getAllStatusOptions, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      setStoreStatuses(data.stores);
      setUserStatuses(data.users);
      setToolStatuses(data.tools);
      setRentalStatuses(data.rentals);
      setGrievanceStatuses(data.grievances);
      setPermissionStatuses(data.permissions);
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
  const [userStatuses, setUserStatuses] = useAtom(userStatusesAtom);
  const [toolStatuses, setToolStatuses] = useAtom(toolStatusesAtom);
  const [rentalStatuses, setRentalStatuses] = useAtom(rentalStatusesAtom);
  const [grievanceStatuses, setGrievanceStatuses] = useAtom(
    grievanceStatusesAtom,
  );
  const [permissionStatuses, setPermissionStatuses] = useAtom(
    permissionStatusesAtom,
  );

  const refresh = () => {
    Promise.all(
      endpoints.getRoleOptions(),
      endpoints.getAllStatusOptions(),
    ).then(([rolesData, statusData]) => {
      setRoles(rolesData.roles);
      setStoreStatuses(statusData.stores);
      setUserStatuses(statusData.users);
      setToolStatuses(statusData.tools);
      setRentalStatuses(statusData.rentals);
      setGrievanceStatuses(statusData.grievances);
      setPermissionStatuses(statusData.permissions);
    });
  };

  return {
    refresh,
    roles,
    storeStatuses,
    userStatuses,
    toolStatuses,
    rentalStatuses,
    grievanceStatuses,
    permissionStatuses,
  };
};
