import { useState, useReducer, useEffect } from "react";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useAuth } from "../state/auth";
import { useDebounce } from "../components/useDebounce";
import * as endpoints from "../api/endpoints";
import { PrevNext } from "../components/PrevNext";

const paramsReducer = (state, action) => {
  switch (action.type) {
    case "page":
      return { ...state, page: action.value };
    case "status":
      return { ...state, status: action.value, page: 1 };
    case "searchTerm":
      return { ...state, searchTerm: action.value, page: 1 };
    case "role":
      return { ...state, role: action.value, page: 1 };
    default:
      return state;
  }
};

export const usePeople = () => {
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
          storeIds:
            params.storeId === "0" ? "" : [parseInt(params.storeId, 10)],
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

  return {
    roles: [...roles, { id: "0", name: "Any" }],
    usersStatuses,
    params,
    debouncedParams,
    peopleList,
    prevPage,
    nextPage,
    setStatus,
    setSearchTerm,
    setRole,
  };
};

export const PurePeople = (people) => {
  const {
    roles,
    usersStatuses,
    params,
    debouncedParams,
    peopleList,
    prevPage,
    nextPage,
    setStatus,
    setSearchTerm,
    setRole,
  } = people;

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
        <ul>
          {peopleList.map((person) => (
            <div key={person.id}>
              <p>{person.username}</p>
              <p>{person.emailAddress}</p>
            </div>
          ))}
        </ul>
      </div>
      <PrevNext prev={prevPage} next={nextPage} pageNumber={debouncedParams.page} />
    </div>
  );
};

export const People = () => {
  const people = usePeople();
  return <PurePeople {...people} />;
}
