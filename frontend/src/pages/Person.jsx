import { useReducer, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";

export const Person = () => {
  const navigate = useNavigate();
  const params = useParams();

  const goToPeople = () => {
    navigate("/people");
  };

  const userInfo = useUserInfo({ id: params.id });
  const userStatus = useUserStatus({ id: params.id });
  const userPermissions = useUserPermissions({ id: params.id });

  return (
    <div>
      <h1>Person</h1>
      <Button onClick={goToPeople} text="All People" />
      <PureUserInfo {...userInfo} />
      <PureUserStatus {...userStatus} />
      <PureUserPermissions {...userPermissions} />
    </div>
  );
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
    !accessToken ? null : `get user ${id} info using ${accessToken}`,
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
  const params = useParams();
  const { userStatuses } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userInfo, setUserInfo] = useState({});
  const [userStatusState, userStatusStateDispatch] = useReducer(
    userStatusStateReducer,
    { value: "", isLoading: true, isSaving: false },
  );

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get user ${id} info using ${accessToken}`,
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
        id: params.id,
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

const userPermissionsStateReducer = (state, action) => {
  switch (action.type) {
    case "library":
      return { ...state, library: action.value };
    case "store":
      return { ...state, store: action.value };
    case "loading":
      return { ...state, isLoading: action.value };
    case "saving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const useUserPermissions = ({ id }) => {
  const { roles } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userPermissions, setUserPermissions] = useState({});
  const [userPermissionsState, userPermissionsStateDispatch] = useReducer(
    userPermissionsStateReducer,
    { library: [], store: [], isLoading: true, isSaving: false },
  );

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get user ${id} permissions using ${accessToken}`,
    () => endpoints.getUserPermissions({ id, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserPermissions(data);
      if (userPermissionsState.isLoading) {
        userPermissionsStateDispatch({ type: "loading", value: false });
        userPermissionsStateDispatch({
          type: "library",
          value: data.library,
        });
        userPermissionsStateDispatch({ type: "store", value: data.store });
      }
    }
  }, [data, userPermissionsState]);

  // const setUserName = (e) => {
  //   userNameStateDispatch({ type: "username", value: e.target.value });
  // };

  // add / remove library permission
  // can if library admin and not my user id
  const canUpdateLibraryPermissions =
    permissions.isLibraryAdmin() && userId != id;

  // add / remove store permission
  // can if store admin
  const canUpdateStorePermissions = permissions.isStoreAdmin();

  // const updateUserName = async () => {
  //   userNameStateDispatch({ type: "saving", value: true });
  //   endpoints
  //     .updateUser({
  //       id: params.id,
  //       username: userNameState.value,
  //       accessToken,
  //     })
  //     .then((data) => {
  //       setUserInfo(data);
  //     })
  //     .finally(() => {
  //       userNameStateDispatch({ type: "saving", value: false });
  //     });
  // };

  return {
    libraryPermissions: userPermissionsState.library,
    storePermissions: userPermissionsState.store,
    roles,
  };
};

const PureUserPermissions = (userPermissions) => {
  const { libraryPermissions, storePermissions, roles } = userPermissions;

  return (
    <div>
      {libraryPermissions.length > 0 ? (
        <>
          <p>Library Permissions</p>
          <ul>
            {libraryPermissions.map((num) => (
              <li key={num}>{roles.find(({ id }) => id == num)?.name}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No Library Permissions</p>
      )}
      {storePermissions.length > 0 ? (
        <>
          <p>Store Permissions</p>
          <ul>
            {storePermissions.map((info) => (
              <li key={info.storeId}>{info.storeName}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No Store Permissions</p>
      )}
    </div>
  );
};
