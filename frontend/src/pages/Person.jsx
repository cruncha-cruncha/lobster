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

export const URL_PERSON_ID_KEY = "personId";

export const usePerson = () => {
  const navigate = useNavigate();
  const params = useParams();

  const goToPeople = () => {
    navigate("/people");
  };

  const userInfo = useUserInfo({ id: params.id });
  const userStatus = useUserStatus({ id: params.id });
  const userPermissions = useUserPermissions({ id: params.id });

  return {
    goToPeople,
    userInfo,
    userStatus,
    userPermissions,
  };
};

export const PurePerson = (person) => {
  const { goToPeople, userInfo, userStatus, userPermissions } = person;

  return (
    <div>
      <h1>Person</h1>
      <Button onClick={goToPeople} text="All People" variant="blue" />
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

  const { data, error, isLoading } = useSWR(
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
  const canUpdateUserName =
    !userNameState.isLoading &&
    !userNameState.isSaving &&
    userNameState.value !== userInfo.username;

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
  } = userInfo;

  return (
    <div>
      <p>{JSON.stringify(data)}</p>
      {showUpdateUserName && (
        <>
          <TextInput
            label="Username"
            value={userName}
            onChange={setUserName}
            disabled={userNameLoading}
          />
          <Button
            text="Update Username"
            onClick={updateUserName}
            disabled={!canUpdateUserName}
          />
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

  const { data, error, isLoading } = useSWR(
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
  const canUpdateUserStatus =
    !userStatusState.isLoading &&
    !userStatusState.isSaving &&
    userStatusState.value != userInfo.status;

  const updateUserStatus = async () => {
    userStatusStateDispatch({ type: "saving", value: true });
    endpoints
      .updateUserStatus({
        id: id,
        sctatus: Number(userStatusState.value),
        accessToken,
      })
      .then((data) => {
        setUserInfo(data);
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
  } = userStatus;

  return (
    <div>
      {showUpdateStatus && (
        <>
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={statusOptions}
            disabled={statusLoading}
          />
          <Button
            text="Update Status"
            onClick={updateStatus}
            disabled={!canUpdateStatus}
          />
        </>
      )}
    </div>
  );
};

export const useUserPermissions = ({ id }) => {
  const { roles } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userPermissions, setUserPermissions] = useState({
    library: [],
    store: [],
  });
  const [saving, setSaving] = useState(false);
  const [showFields, setShowFields] = useState(""); // "", "add", "remove"
  const [selectedRole, selectRoleOption] = useState("0");
  const storeSelect = useSingleStoreSelect();
  // const [storeTerm, _setStoreTerm] = useState("");
  // const [storeId, _setStoreId] = useState("0");
  // const [storeOptions, setStoreOptions] = useState([]);

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
    setSaving(true);
    endpoints
      .removeUserPermission({
        id: permissionId,
        accessToken,
      })
      .then(() => mutate())
      .finally(() => {
        setSaving(false);
      });
  };

  const addPermission = async () => {
    setSaving(true);

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
        setSaving(false);
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
  } = userPermissions;

  return (
    <div>
      {libraryPermissions.length <= 0 && storePermissions.length <= 0 ? (
        <p>No Permissions</p>
      ) : (
        <>
          <p>Permissions</p>
          <ul>
            {libraryPermissions.map((permission) => (
              <li key={permission.id}>
                {showFields === "remove" &&
                  canRemovePermission(permission.id) && (
                    <span
                      onClick={() =>
                        removePermission({ permissionId: permission.id })
                      }
                      className="cursor-pointer"
                    >
                      X
                    </span>
                  )}{" "}
                {permission.roleName}
              </li>
            ))}
            {storePermissions.map((info) => (
              <li key={info.id}>
                {showFields === "remove" && canRemovePermission(info.id) && (
                  <span
                    onClick={() => removePermission({ permissionId: info.id })}
                    className="cursor-pointer"
                  >
                    X
                  </span>
                )}{" "}
                {info.roleName} of {info.storeName}
              </li>
            ))}
          </ul>
        </>
      )}
      {showModifyPermissions && (
        <>
          {showFields === "add" && (
            <>
              <Select
                label="Role"
                options={roleOptions}
                value={selectedRole}
                onChange={setSelectedRole}
              />
              {showStoreSearch && <PureSingleStoreSelect {...storeSelect} />}
              <Button
                text="Add Permission"
                disabled={!canAddPermission}
                onClick={addPermission}
              />
              <Button text="Cancel" onClick={toggleShowFields} />
            </>
          )}
          {showFields === "remove" && (
            <>
              <Button text="Done" onClick={toggleShowFields} />
            </>
          )}
          {showFields === "" && (
            <>
              <Button text="Add Permission" onClick={showAddFields} />
              <Button text="Remove Permissions" onClick={showRemoveFields} />
            </>
          )}
        </>
      )}
    </div>
  );
};
