import { useState, useReducer, useEffect } from "react";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useAuth } from "../state/auth";
import { useDebounce } from "../components/useDebounce";
import * as endpoints from "../api/endpoints";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "page":
      return { ...state, page: action.value };
    case "status":
      return { ...state, status: action.value };
    case "searchTerm":
      return { ...state, searchTerm: action.value };
    case "role":
      return { ...state, role: action.value };
    default:
      return state;
  }
};

export const People = () => {
  // filters
  // search
  // pagination
  // username, email, roles, store, created_at, status
  // link to info (edit)

  const { roles, usersStatuses } = useConstants();
  const { accessToken } = useAuth();

  const [peopleList, setPeopleList] = useState([]);
  const [params, paramsDispatch] = useReducer(paramsReducer, {
    searchTerm: "",
    page: 1,
    storeId: "0",
    status: "0",
    role: "0",
  });

  const debouncedParams = useDebounce(params, 200);

  const prevPage = () => {
    if (params.page > 1) {
      paramsDispatch({ type: "page", value: params.page - 1 });
    }
  };
  const nextPage = () =>
    paramsDispatch({ type: "page", value: params.page + 1 });
  const setStatus = (e) =>
    paramsDispatch({ type: "status", value: e.target.value });
  const setSearchTerm = (e) =>
    paramsDispatch({ type: "searchTerm", value: e.target.value });
  const setRole = (e) =>
    paramsDispatch({ type: "role", value: e.target.value });

  useEffect(() => {
    if (JSON.stringify(params) !== JSON.stringify(debouncedParams)) {
      return;
    }

    endpoints
      .getUsers({
        params: {
          term: params.searchTerm,
          storeIds: params.storeId === "0" ? "" : [parseInt(params.storeId, 10)],
          statuses: params.status === "0" ? "" : [parseInt(params.status, 10)],
          roles: params.role === "0" ? "" : [parseInt(params.role, 10)],
          page: params.page,
        },
        accessToken,
      })
      .then((data) => {
        setPeopleList(data.users);
      });
  }, [params, debouncedParams, accessToken]);

  return (
    <div>
      <h1>People</h1>
      <div>
        <TextInput
          value={params.searchTerm}
          onChange={setSearchTerm}
          placeholder="Maverick"
          label="Search"
        />
        <Select
          label="Status"
          options={usersStatuses}
          value={params.status}
          onChange={setStatus}
        />
        <Select
          label="Role"
          options={roles}
          value={params.role}
          onChange={setRole}
        />
      </div>
      <div>
        <p>results</p>
        <ul>
          {peopleList.map((person) => (
            <div key={person.id}><p>{person.username}</p><p>{person.emailAddress}</p></div>
          ))}
        </ul>
      </div>
    </div>
  );
};
