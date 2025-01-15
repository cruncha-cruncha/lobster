import { useReducer, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { PureSingleStoreSelect, useSingleStoreSelect } from "./People";
import { URL_ACCUSED_ID_KEY } from "./Grievances";

export const URL_PERSON_ID_KEY = "personId";

export const usePerson = () => {
  const navigate = useNavigate();
  const params = useParams();
  const userId = params.id;

  const goToPeople = () => {
    navigate("/people");
  };

  const goToRentals = () => {
    navigate(`/rentals?${URL_PERSON_ID_KEY}=${userId}`);
  };

  const goToGrievances = () => {
    navigate(`/grievances?${URL_ACCUSED_ID_KEY}=${userId}`);
  };

  const userInfo = useUserInfo({ id: userId });
  const userStatus = useUserStatus({ id: userId });
  const userPermissions = useUserPermissions({ id: userId });

  return {
    username: userInfo.data.username || "Person",
    goToPeople,
    goToRentals,
    goToGrievances,
    userInfo,
    userStatus,
    userPermissions,
  };
};

export const PurePerson = (person) => {
  const {
    goToPeople,
    userInfo,
    userStatus,
    userPermissions,
    goToRentals,
    goToGrievances,
    username,
  } = person;

  return (
    <div>
      <h1 className="mt-2 px-2 text-xl">{username}</h1>
      <div className="my-2 flex justify-start gap-2 px-2">
        <Button
          onClick={goToGrievances}
          text="Grievances"
          variant="blue"
          size="sm"
        />
        <Button onClick={goToRentals} text="Rentals" variant="blue" size="sm" />
        <Button
          onClick={goToPeople}
          text="All People"
          variant="blue"
          size="sm"
        />
      </div>

      <PureUserInfo {...userInfo} />
      <PureUserStatus {...userStatus} />
      <PureUserPermissions {...userPermissions} />
    </div>
  );
};

export const Person = () => {
  const person = usePerson();
  return <PurePerson {...person} />;
};

const userNameStateReducer = (state, action) => {
  switch (action.type) {
    case "value":
      return { ...state, value: action.value };
    case "loading":
      return { ...state, isLoading: action.value };
    case "saving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const useUserInfo = ({ id }) => {
  const { userId, accessToken } = useAuth();
  const [userInfo, setUserInfo] = useState({});
  const [userNameState, userNameStateDispatch] = useReducer(
    userNameStateReducer,
    { value: "", isLoading: true, isSaving: false },
  );

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get user ${id} info, using ${accessToken}`,
    () => endpoints.getUser({ id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserInfo(data);
      if (userNameState.isLoading) {
        userNameStateDispatch({ type: "loading", value: false });
        userNameStateDispatch({ type: "value", value: data.username });
      }
    }
  }, [data, userNameState]);

  const setUserName = (e) => {
    userNameStateDispatch({ type: "value", value: e.target.value });
  };

  const showUpdateUserName = userId == id;
  const canUpdateUserName = userNameState.value !== userInfo.username;

  const updateUserName = async () => {
    userNameStateDispatch({ type: "saving", value: true });
    endpoints
      .updateUser({
        id,
        username: userNameState.value,
        accessToken,
      })
      .then((data) => {
        setUserInfo(data);
        mutate();
      })
      .finally(() => {
        userNameStateDispatch({ type: "saving", value: false });
      });
  };

  return {
    data: userInfo,
    showUpdateUserName,
    userName: userNameState.value,
    userNameLoading: userNameState.isLoading,
    setUserName,
    canUpdateUserName,
    updateUserName,
    isUpdating: userNameState.isSaving,
  };
};

const PureUserInfo = (userInfo) => {
  const {
    data,
    showUpdateUserName,
    userName,
    userNameLoading,
    setUserName,
    canUpdateUserName,
    updateUserName,
    isUpdating,
  } = userInfo;

  return (
    <div className="px-2">
      <p>{JSON.stringify(data)}</p>
      {showUpdateUserName && (
        <>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              label="Username"
              value={userName}
              onChange={setUserName}
              disabled={userNameLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              text="Update Username"
              onClick={updateUserName}
              disabled={!canUpdateUserName}
              isLoading={isUpdating}
            />
          </div>
        </>
      )}
    </div>
  );
};

const userStatusStateReducer = (state, action) => {
  switch (action.type) {
    case "value":
      return { ...state, value: action.value };
    case "loading":
      return { ...state, isLoading: action.value };
    case "saving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const useUserStatus = ({ id }) => {
  const { userStatuses } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userInfo, setUserInfo] = useState({});
  const [userStatusState, userStatusStateDispatch] = useReducer(
    userStatusStateReducer,
    { value: "", isLoading: true, isSaving: false },
  );

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get user ${id} info, using ${accessToken}`,
    () => endpoints.getUser({ id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserInfo(data);
      if (userStatusState.isLoading) {
        userStatusStateDispatch({ type: "loading", value: false });
        userStatusStateDispatch({ type: "value", value: data.status });
      }
    }
  }, [data, userStatusState]);

  const setStatus = (e) => {
    userStatusStateDispatch({ type: "value", value: e.target.value });
  };

  const showUpdateUserStatus = permissions.isUserAdmin() && userId != id;
  const canUpdateUserStatus = userStatusState.value != userInfo.status;

  const updateUserStatus = async () => {
    userStatusStateDispatch({ type: "saving", value: true });
    endpoints
      .updateUserStatus({
        id: id,
        status: Number(userStatusState.value),
        accessToken,
      })
      .then((data) => {
        setUserInfo(data);
        mutate();
      })
      .finally(() => {
        userStatusStateDispatch({ type: "saving", value: false });
      });
  };

  return {
    showUpdateStatus: showUpdateUserStatus,
    statusOptions: userStatuses,
    status: userStatusState.value,
    statusLoading: userStatusState.isLoading,
    setStatus,
    canUpdateStatus: canUpdateUserStatus,
    updateStatus: updateUserStatus,
    isUpdatingStatus: userStatusState.isSaving,
  };
};

const PureUserStatus = (userStatus) => {
  const {
    showUpdateStatus,
    statusOptions,
    status,
    statusLoading,
    setStatus,
    canUpdateStatus,
    updateStatus,
    isUpdatingStatus,
  } = userStatus;

  return (
    <>
      {showUpdateStatus && (
        <div className="px-2">
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <Select
              label="Status"
              value={status}
              onChange={setStatus}
              options={statusOptions}
              disabled={statusLoading}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              text="Update Status"
              onClick={updateStatus}
              disabled={!canUpdateStatus}
              isLoading={isUpdatingStatus}
            />
          </div>
        </div>
      )}
    </>
  );
};

export const useUserPermissions = ({ id }) => {
  const { roles } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userPermissions, setUserPermissions] = useState({
    library: [],
    store: [],
  });
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [isRemovingPermissions, setIsRemovingPermissions] = useState([]);
  const [showFields, setShowFields] = useState(""); // "", "add", "remove"
  const [selectedRole, selectRoleOption] = useState("0");
  const storeSelect = useSingleStoreSelect();

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get user ${id} permissions, using ${accessToken}`,
    () => endpoints.getUserPermissions({ id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserPermissions(data);
    }
  }, [data]);

  const canUpdateLibraryPermissions =
    permissions.isLibraryAdmin() && userId != id;

  const canUpdateStorePermissions = permissions.isStoreAdmin();

  const removePermission = async ({ permissionId }) => {
    setIsRemovingPermissions((prev) => [
      ...prev.filter((id) => id != permissionId),
      permissionId,
    ]);

    endpoints
      .removeUserPermission({
        id: permissionId,
        accessToken,
      })
      .then(() => mutate())
      .finally(() => {
        setSaving(false);
        setIsRemovingPermissions((prev) => [
          ...prev.filter((id) => id != permissionId),
        ]);
      });
  };

  const addPermission = async () => {
    setIsAddingPermission(true);

    const permission = {
      userId: Number(id),
      roleId: Number(selectedRole),
      storeId: Number(storeSelect.storeId),
    };
    if (
      selectedRoleName !== "store_rep" &&
      selectedRoleName !== "tool_manager"
    ) {
      delete permission.storeId;
    }

    endpoints
      .addUserPermission({
        permission,
        accessToken,
      })
      .then(() => mutate())
      .finally(() => {
        setIsAddingPermission(false);
      });
  };

  const roleOptions = roles.filter(({ name }) => {
    switch (name) {
      case "library_admin":
      case "store_admin":
      case "user_admin":
        return canUpdateLibraryPermissions;
      case "store_rep":
      case "tool_manager":
        return canUpdateStorePermissions;
      default:
        return false;
    }
  });

  const selectedRoleName = roles.find(({ id }) => id == selectedRole)?.name;

  const canAddPermission = (() => {
    if (showFields !== "add") return false;
    switch (selectedRoleName) {
      case "library_admin":
      case "store_admin":
      case "user_admin":
        return true;
      case "store_rep":
      case "tool_manager":
        return storeSelect.storeId != "";
      default:
        return false;
    }
  })();

  const showStoreSearch =
    selectedRoleName === "store_rep" || selectedRoleName === "tool_manager";

  // TODO: store_reps should be able to modify permissions for their store
  // limit store options to stores they're a rep for?

  const permissionLookup = [
    ...userPermissions.library,
    ...userPermissions.store,
  ].reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const canRemovePermission = (permissionId) => {
    const permission = permissionLookup[permissionId];
    if (!permission) return false;
    const roleName = roles.find(({ id }) => id == permission.role)?.name;
    switch (roleName) {
      case "library_admin":
      case "store_admin":
      case "user_admin":
        return canUpdateLibraryPermissions;
      case "store_rep":
      case "tool_manager":
        return canUpdateStorePermissions;
      default:
        return false;
    }
  };

  return {
    libraryPermissions: userPermissions.library.map((p) => ({
      id: p.id,
      roleId: p.role,
      roleName: roles.find(({ id }) => id == p.role)?.name,
    })),
    storePermissions: userPermissions.store.map((p) => ({
      id: p.id,
      storeId: p.storeId,
      storeName: userPermissions.storeNames.find(
        ({ storeId }) => storeId == p.storeId,
      )?.storeName,
      roleId: p.role,
      roleName: roles.find(({ id }) => id == p.role)?.name,
    })),
    showModifyPermissions:
      canUpdateLibraryPermissions || canUpdateStorePermissions,
    showFields,
    showAddFields: () => setShowFields("add"),
    showRemoveFields: () => setShowFields("remove"),
    toggleShowFields: () => setShowFields(""),
    roleOptions: [{ name: "Select Role", id: "0" }, ...roleOptions],
    selectedRole,
    setSelectedRole: (e) => selectRoleOption(e.target.value),
    showStoreSearch,
    storeSelect,
    canAddPermission,
    addPermission,
    canRemovePermission,
    removePermission,
    isAddingPermission,
    isRemovingPermissions,
  };
};

const PureUserPermissions = (userPermissions) => {
  const {
    libraryPermissions,
    storePermissions,
    showModifyPermissions,
    showFields,
    showAddFields,
    showRemoveFields,
    toggleShowFields,
    roleOptions,
    selectedRole,
    setSelectedRole,
    showStoreSearch,
    canAddPermission,
    addPermission,
    storeSelect,
    canRemovePermission,
    removePermission,
    isAddingPermission,
    isRemovingPermissions,
  } = userPermissions;

  return (
    <div>
      <h2 className="px-2 text-lg">Permissions</h2>
      <ul className="mt-1 border-x-2 border-stone-400 px-2 py-px">
        {libraryPermissions.length <= 0 && storePermissions.length <= 0 && (
          <li className="text-stone-400">none found</li>
        )}
        {libraryPermissions.map((permission) => (
          <li
            key={permission.id}
            className="my-1 flex items-center justify-between"
          >
            <span>{permission.roleName}</span>
            {showFields === "remove" && canRemovePermission(permission.id) && (
              <Button
                onClick={() =>
                  removePermission({ permissionId: permission.id })
                }
                text="X"
                variant="red"
                size="sm"
              />
            )}
          </li>
        ))}
        {storePermissions.map((info) => (
          <li key={info.id} className="my-1 flex items-center justify-between">
            <span>
              {info.roleName} of {info.storeName}
            </span>
            {showFields === "remove" && canRemovePermission(info.id) && (
              <Button
                onClick={() => removePermission({ permissionId: info.id })}
                text="X"
                size="sm"
                variant="red"
                disabled={isRemovingPermissions.includes(info.id)}
              />
            )}
          </li>
        ))}
      </ul>
      {showModifyPermissions && (
        <div className="px-2">
          {showFields === "add" && (
            <>
              <div className="my-3 grid grid-cols-1 gap-x-4 gap-y-2">
                <Select
                  label="Role"
                  options={roleOptions}
                  value={selectedRole}
                  onChange={setSelectedRole}
                />
                {showStoreSearch && <PureSingleStoreSelect {...storeSelect} />}
              </div>
              <div className="mt-3 flex justify-between gap-2">
                <Button
                  text="Cancel"
                  onClick={toggleShowFields}
                  variant="blue"
                />
                <Button
                  text="Add Permission"
                  disabled={!canAddPermission}
                  onClick={addPermission}
                  isLoading={isAddingPermission}
                />
              </div>
            </>
          )}
          {showFields === "remove" && (
            <div className="mt-3 flex justify-start gap-2">
              <Button text="Done" onClick={toggleShowFields} variant="blue" />
            </div>
          )}
          {showFields === "" && (
            <div className="mt-3 flex justify-start gap-2">
              <Button
                text="Add Permission"
                onClick={showAddFields}
                variant="blue"
              />
              <Button
                text="Remove Permissions"
                onClick={showRemoveFields}
                variant="blue"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
