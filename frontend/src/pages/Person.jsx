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
// edit username

export const Person = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { roles, userStatuses } = useConstants();
    const { accessToken } = useAuth();
    const [userInfo, setUserInfo] = useState({});
  
    const { error, isLoading } = useSWR(
      !accessToken ? null : `get user ${params.id} using ${accessToken}`,
      () => endpoints.getUser({ id: params.id, accessToken }),
      {
        onSuccess: (data) => {
          setUserInfo(data);
        },
      },
    );
  
    const goToPeople = () => {
      navigate("/people");
    };

    return (
        <div>
            <h1>Person</h1>
            <Button onClick={goToPeople} text="All People" />
            <p>{JSON.stringify(userInfo)}</p>
        </div>
    );
}