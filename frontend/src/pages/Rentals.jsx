import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useNavigate, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { URL_STORE_ID_KEY } from "./Store";
import { useToolCategories } from "../state/toolCategories";
import { PrevNext } from "../components/PrevNext";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";
import { useStoreSelect, PureStoreSelect } from "./Tools";

export const Rentals = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const storeSelect = useStoreSelect();
  const userSelect = useUserSelect();
  const toolSelect = useToolSelect();
  const [rentals, setRentals] = useState([]);
  const [stillOpen, _setStillOpen] = useState(true);

  const endpointParams = {
    storeIds: storeSelect.stores.map((s) => s.id),
    renterIds: userSelect.users.map((u) => u.id),
    toolIds: toolSelect.tools.map((t) => t.id),
    open: stillOpen,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get rentals, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchRentals({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setRentals(data.rentals);
    }
  }, [data]);

  const setStillOpen = (e) => {
    _setStillOpen(e.target.checked);
  }

  // simple store search
  // user search
  // tool search

  // rental still open
  // rental overdue
  // start or end date range
  // sort by start date or end date
  // sort order

  // page

  return (
    <div>
      <h1>Rentals</h1>
      <PureStoreSelect {...storeSelect} />
      <PureUserSelect {...userSelect} />
      <PureToolSelect {...toolSelect} />
      <Checkbox label="Still Open" checked={stillOpen} onChange={setStillOpen} />
      <ul>
        {rentals.map((rental) => (
          <li key={rental.id}>{JSON.stringify(rental)}</li>
        ))}
      </ul>
    </div>
  );
};

export const useUserSelect = () => {
  const { accessToken } = useAuth();
  const { cache } = useSWRConfig();
  const [users, setUsers] = useState([]);
  const [userTerm, _setUserTerm] = useState("");
  const [userOptions, setUserOptions] = useState([]);

  const endpointParams = {
    term: userTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken}, term ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.getUsers({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setUserOptions(data.users);
    }
  }, [data]);

  const setUserTerm = (e) => {
    _setUserTerm(e.target.value);
  };

  const addUser = async (userId) => {
    if (users.find((u) => u.id == userId)) return;
    let newUser = userOptions.find((u) => u.id == userId);
    if (!newUser) {
      newUser = await endpoints.getUser({ id: userId, accessToken });
      cache.set(`get user ${userId}, using ${accessToken}`, newUser);
    }
    !!newUser && setUsers((prev) => [...prev, newUser]);
  };

  const removeUser = (userId) => {
    setUsers(users.filter((u) => u.id != userId));
  };

  return {
    users,
    userTerm,
    setUserTerm,
    userOptions: userOptions.map((u) => ({
      id: u.id,
      name: u.username,
    })),
    removeUser,
    addUser,
  };
};

export const PureUserSelect = (userSelect) => {
  const { users, userTerm, setUserTerm, userOptions, removeUser, addUser } =
    userSelect;

  return (
    <>
      <SearchSelect
        label="User"
        value={userTerm}
        onChange={setUserTerm}
        options={userOptions}
        onSelect={addUser}
        showLastSelected={false}
      />
      <ul>
        {users.map((user) => (
          <li key={user.id} onClick={() => removeUser(user.id)}>
            {JSON.stringify(user)}
          </li>
        ))}
      </ul>
    </>
  );
};

export const useToolSelect = () => {
  const { accessToken } = useAuth();
  const { cache } = useSWRConfig();
  const [tools, setTools] = useState([]);
  const [toolTerm, _setToolTerm] = useState("");
  const [toolOptions, setToolOptions] = useState([]);

  const endpointParams = {
    term: toolTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get tools, using ${accessToken}, term ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchTools({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setToolOptions(data.tools);
    }
  }, [data]);

  const setToolTerm = (e) => {
    _setToolTerm(e.target.value);
  };

  const addTool = async (toolId) => {
    if (tools.find((t) => t.id == toolId)) return;
    let newTool = toolOptions.find((t) => t.id == toolId);
    if (!newTool) {
      newTool = await endpoints.getTool({ id: toolId, accessToken });
      cache.set(`get tool ${toolId}, using ${accessToken}`, newTool);
    }
    !!newTool && setTools((prev) => [...prev, newTool]);
  };

  const removeTool = (toolId) => {
    setTools(tools.filter((t) => t.id != toolId));
  };

  return {
    tools,
    toolTerm,
    setToolTerm,
    toolOptions: toolOptions.map((t) => ({
      id: t.id,
      name: `${t.realId}, ${t.description}`,
    })),
    removeTool,
    addTool,
  };
};

export const PureToolSelect = (toolSelect) => {
  const { tools, toolTerm, setToolTerm, toolOptions, removeTool, addTool } =
    toolSelect;

  return (
    <>
      <SearchSelect
        label="Tool"
        value={toolTerm}
        onChange={setToolTerm}
        options={toolOptions}
        onSelect={addTool}
        showLastSelected={false}
      />
      <ul>
        {tools.map((tool) => (
          <li key={tool.id} onClick={() => removeTool(tool.id)}>
            {JSON.stringify(tool)}
          </li>
        ))}
      </ul>
    </>
  );
};
