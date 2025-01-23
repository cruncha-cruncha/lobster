import { useReducer, useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { PureSingleStoreSelect, useSingleStoreSelect } from "./People";
import { URL_ACCUSED_ID_KEY } from "./Grievances";
import { validatePassword } from "./Login";
import { useLayoutInfoModal } from "../state/layoutInfoModal";

export const URL_PERSON_ID_KEY = "personId";

export const usePerson = () => {
  const params = useParams();
  const userId = params.id;

  const goToPeople = () => "/people";

  const goToRentals = () => `/rentals?${URL_PERSON_ID_KEY}=${userId}`;

  const goToGrievances = () => `/grievances?${URL_ACCUSED_ID_KEY}=${userId}`;

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
          goTo={goToPeople()}
          text="All People"
          variant="blue"
          size="sm"
        />
        <Button
          goTo={goToGrievances()}
          text="Grievances"
          variant="blue"
          size="sm"
        />
        <Button goTo={goToRentals()} text="Rentals" variant="blue" size="sm" />
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
  const { userId, accessToken, permissions } = useAuth();
  const { userStatuses } = useConstants();
  const [userInfo, setUserInfo] = useState({});
  const [oldPassword, _setOldPassword] = useState("");
  const [newPassword, _setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resetWarningLevel, setResetWarningLevel] = useState(0);
  const [warningTimeout, setWarningTimeout] = useState(null);
  const modal = useLayoutInfoModal();
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
  const canUpdateUserName =
    userInfo.username && userNameState.value !== userInfo.username;

  const updateUserName = async () => {
    userNameStateDispatch({ type: "saving", value: true });
    endpoints
      .updateUser({
        id,
        info: { username: userNameState.value },
        accessToken,
      })
      .then((data) => {
        setUserInfo(data);
        mutate(data);
      })
      .finally(() => {
        userNameStateDispatch({ type: "saving", value: false });
      });
  };

  const setNewPassword = (e) => {
    _setNewPassword(e.target.value);
    setResetWarningLevel(0);
    if (warningTimeout) {
      clearTimeout(warningTimeout);
      setWarningTimeout(null);
    }
  };

  const setOldPassword = (e) => {
    _setOldPassword(e.target.value);
  };

  const updatePassword = async () => {
    setUpdatingPassword(true);

    return endpoints
      .updateUser({
        id,
        info: { newPassword, oldPassword },
        accessToken,
      })
      .then(() => {
        _setNewPassword("");
        _setOldPassword("");
        modal.open("Password updated", "success");
      })
      .catch((e) => {
        console.log(e);
        modal.open("Unable to update password", "error");
      })
      .finally(() => {
        setUpdatingPassword(false);
      });
  };

  const resetPassword = async () => {
    if (resetWarningLevel === 0) {
      setResetWarningLevel(1);
      setWarningTimeout(
        setTimeout(() => {
          setResetWarningLevel(2);
        }, 5000),
      );
      return;
    }

    setUpdatingPassword(true);

    return endpoints
      .resetPassword({
        info: { userId: Number(id), newPassword },
        accessToken,
      })
      .then(() => {
        _setNewPassword("");
        setResetWarningLevel(0);
        modal.open("Password updated", "success");
      })
      .catch((e) => {
        console.log(e);
        modal.open("Unable to update password", "error");
      })
      .finally(() => {
        setUpdatingPassword(false);
      });
  };

  const resetWarning = (() => {
    switch (resetWarningLevel) {
      case 0:
        return "";
      case 1:
        return "Please wait 5 seconds...";
      case 2:
        return "Are you sure?";
      case 3:
        return "Please wait...";
      default:
        return "";
    }
  })();

  return {
    data: {
      ...userInfo,
      status: userStatuses.find((s) => s.id == userInfo.status),
    },
    showUpdateUserName,
    userName: userNameState.value,
    userNameLoading: userNameState.isLoading,
    setUserName,
    canUpdateUserName,
    updateUserName,
    isUpdating: userNameState.isSaving,
    showUpdatePassword: id == userId,
    showResetPassword: id != userId && permissions.isUserAdmin(),
    newPassword,
    oldPassword,
    canUpdatePassword:
      validatePassword(oldPassword) &&
      validatePassword(newPassword) &&
      oldPassword !== newPassword,
    canResetPassword:
      validatePassword(newPassword) &&
      resetWarning != "Please wait 5 seconds...",
    setNewPassword,
    setOldPassword,
    updatingPassword,
    updatePassword,
    resetPassword,
    resetWarning,
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
    showUpdatePassword,
    showResetPassword,
    newPassword,
    oldPassword,
    setNewPassword,
    setOldPassword,
    canUpdatePassword,
    canResetPassword,
    updatingPassword,
    updatePassword,
    resetPassword,
    resetWarning,
  } = userInfo;

  return (
    <div className="px-2">
      <p>status: {data?.status?.name}</p>
      <p>
        email:{" "}
        {!data.emailAddress?.trim() ? (
          <span className="text-stone-400">unknown</span>
        ) : (
          data.emailAddress.trim()
        )}
      </p>
      <p>
        code:{" "}
        {!data.code?.trim() ? (
          <span className="text-stone-400">unknown</span>
        ) : (
          data.code.trim()
        )}
      </p>
      {showUpdateUserName && (
        <>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              id={`person-username`}
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
      {showUpdatePassword && (
        <div>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              id={`person-old-password`}
              label="Current Password"
              value={oldPassword}
              onChange={setOldPassword}
              disabled={updatingPassword}
            />
            <TextInput
              id={`person-new-password`}
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={updatingPassword}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              text="Update Password"
              disabled={!canUpdatePassword}
              onClick={updatePassword}
              isLoading={updatingPassword}
            />
          </div>
        </div>
      )}
      {showResetPassword && (
        <div>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
            <TextInput
              id={`person-reset-password`}
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={updatingPassword}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            {resetWarning && <p>{resetWarning}</p>}
            <Button
              text="Reset Password"
              disabled={!canResetPassword}
              onClick={resetPassword}
            />
          </div>
        </div>
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
        mutate(data);
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
              id={`person-status`}
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

  const canUpdateLibraryPermissions =
    permissions.isLibraryAdmin() && userId != id;
  const isAnyStoreRep = permissions.isAnyStoreRep();
  const canUpdateStorePermissions =
    permissions.isStoreAdmin() || (isAnyStoreRep && userId != id);
  const isOnlyStoreRep =
    isAnyStoreRep &&
    !permissions.isStoreAdmin() &&
    !permissions.isLibraryAdmin();

  const [userPermissions, setUserPermissions] = useState({
    library: [],
    store: [],
  });
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [isRemovingPermissions, setIsRemovingPermissions] = useState(false);
  const [showFields, setShowFields] = useState(""); // "", "add", "remove"
  const [selectedRole, _setSelectedRole] = useState("0");
  const storeSelect = useSingleStoreSelect({
    filterParams: {
      ...(!isOnlyStoreRep ? {} : { userIds: [userId] }),
    },
  });
  const [toDelete, _setToDelete] = useState([]);

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get user ${id} permissions, using ${accessToken}`,
    () => endpoints.getUserPermissions({ id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserPermissions(data);
    }
  }, [data]);

  const removePermissions = async () => {
    setIsRemovingPermissions(true);

    await Promise.all(
      toDelete.map((id) =>
        endpoints.removeUserPermission({ id, accessToken }).then(() => {
          mutate((prev) => ({
            ...prev,
            library: prev.library.filter((p) => p.id != id),
            store: prev.store.filter((p) => p.id != id),
          }));
        }),
      ),
    )
      .catch((e) => {
        // do something
      })
      .finally(() => {
        setIsRemovingPermissions(false);
        _setToDelete([]);
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
      selectedRoleName !== "store_manager" &&
      selectedRoleName !== "tool_manager"
    ) {
      delete permission.storeId;
    }

    endpoints
      .addUserPermission({
        permission,
        accessToken,
      })
      .then((data) => {
        _setSelectedRole("0");
        storeSelect.setStoreId("");
        storeSelect.setStoreTerm({ target: { value: "" } });
        setShowFields("");
        if (data.storeId) {
          mutate((prev) => ({
            ...prev,
            store: [
              ...prev.store,
              {
                id: data.id,
                storeId: data.storeId,
                role: data.roleId,
              },
            ],
          }));
        } else {
          mutate((prev) => ({
            ...prev,
            library: [
              ...prev.library,
              {
                id: data.id,
                role: data.roleId,
              },
            ],
          }));
        }
      })
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
      case "store_manager":
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
      case "store_manager":
      case "tool_manager":
        return storeSelect.storeId != "";
      default:
        return false;
    }
  })();

  const showStoreSearch =
    selectedRoleName === "store_manager" || selectedRoleName === "tool_manager";

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
      case "store_manager":
      case "tool_manager":
        return canUpdateStorePermissions;
      default:
        return false;
    }
  };

  const goToStore = (storeId) => `/stores/${storeId}`;

  const toggleMarkPermissioForDelete = (permissionId) => {
    _setToDelete((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id != permissionId);
      }
      return [...prev, permissionId];
    });
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
    toggleShowFields: () => {
      setShowFields("");
      _setToDelete([]);
    },
    roleOptions: [{ name: "Select Role", id: "0" }, ...roleOptions],
    selectedRole,
    setSelectedRole: (e) => _setSelectedRole(e.target.value),
    showStoreSearch,
    storeSelect,
    canAddPermission,
    addPermission,
    canRemovePermission,
    isAddingPermission,
    isRemovingPermissions,
    canRemovePermissions: toDelete.length > 0,
    goToStore,
    toDelete,
    toggleMarkPermissioForDelete,
    removePermissions,
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
    isAddingPermission,
    isRemovingPermissions,
    canRemovePermissions,
    goToStore,
    toDelete,
    toggleMarkPermissioForDelete,
    removePermissions,
  } = userPermissions;

  return (
    <div className="mt-3">
      <h2 className="px-2 text-lg">Permissions</h2>
      <ul className="mt-1 overflow-y-auto border-x-2 border-stone-400 px-2 py-px [&>*]:my-1">
        {libraryPermissions.length <= 0 && storePermissions.length <= 0 && (
          <li className="text-stone-400">none found</li>
        )}
        {[...libraryPermissions, ...storePermissions].map((info) => (
          <li
            key={info.id}
            className={
              (showFields === "remove" && canRemovePermission(info.id)
                ? " cursor-pointer"
                : "") + (toDelete.includes(info.id) ? " text-stone-400" : "")
            }
            onClick={() => {
              if (showFields === "remove" && canRemovePermission(info.id)) {
                toggleMarkPermissioForDelete(info.id);
              }
            }}
          >
            {showFields === "remove" &&
              canRemovePermission(info.id) &&
              !toDelete.includes(info.id) && (
                <span className="text-red-400">X </span>
              )}
            <span>{info.roleName}</span>
            {info.storeName && (
              <>
                <span> of </span>
                {showFields === "remove" && canRemovePermission(info.id) ? (
                  <span>{info.storeName}</span>
                ) : (
                  <Link to={goToStore(info.storeId)}>{info.storeName}</Link>
                )}
              </>
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
                  id={`person-role`}
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
            <div className="mt-3 flex justify-between gap-2">
              <Button text="Cancel" onClick={toggleShowFields} variant="blue" />
              <Button
                text="Save Changes"
                disabled={!canRemovePermissions}
                onClick={removePermissions}
                isLoading={isRemovingPermissions}
              />
            </div>
          )}
          {showFields === "" && (
            <div className="mt-3 flex justify-start gap-2">
              <Button
                text="Add Permission"
                onClick={showAddFields}
                variant="blue"
              />
              {(libraryPermissions.length > 0 ||
                storePermissions.length > 0) && (
                <Button
                  text="Remove Permissions"
                  onClick={showRemoveFields}
                  variant="blue"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
