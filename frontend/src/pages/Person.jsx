import { useReducer, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useDebounce } from "../components/useDebounce";

// add permission
// remove permission
// edit username (only if it's your id)
// ban a user if allowed

const userNameStateReducer = (state, action) => {
  switch (action.type) {
    case "username":
      return { ...state, value: action.value };
    case "loading":
      return { ...state, isLoading: action.value };
    case "saving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const Person = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { roles, userStatuses } = useConstants();
  const { userId, accessToken, permissions } = useAuth();
  const [userInfo, setUserInfo] = useState({});
  const [userNameState, userNameStateDispatch] = useReducer(
    userNameStateReducer,
    { value: "", isLoading: true, isSaving: false },
  );

  const { error, isLoading } = useSWR(
    !accessToken ? null : `get user ${params.id} using ${accessToken}`,
    () => endpoints.getUser({ id: params.id, accessToken }),
    {
      onSuccess: (data) => {
        setUserInfo(data);
        if (userNameState.isLoading) {
          userNameStateDispatch({ type: "loading", value: false });
          userNameStateDispatch({ type: "username", value: data.username });
        }
      },
    },
  );

  const goToPeople = () => {
    navigate("/people");
  };

  const setUserName = (e) => {
    userNameStateDispatch({ type: "username", value: e.target.value });
  };

  const isMyUser = userId == params.id;

  const canUpdateUserName =
    !userNameState.isLoading &&
    !userNameState.isSaving &&
    userNameState.value !== userInfo.username;

  const updateUserName = async () => {
    userNameStateDispatch({ type: "saving", value: true });
    endpoints
      .updateUser({
        id: params.id,
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

  return (
    <div>
      <h1>Person</h1>
      <Button onClick={goToPeople} text="All People" />
      <p>{JSON.stringify(userInfo)}</p>
      {isMyUser && (
        <>
          <TextInput
            label="Username"
            value={userNameState.value}
            onChange={setUserName}
            disabled={userNameState.isLoading}
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
