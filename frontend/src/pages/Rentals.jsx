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
import { URL_TOOL_ID_KEY } from "./Tool";
import { URL_PERSON_ID_KEY } from "./Person";
import { useToolCategories } from "../state/toolCategories";
import { PrevNext } from "../components/PrevNext";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";
import { useStoreSelect, PureStoreSelect } from "./Tools";

export const useRentals = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const _storeSelect = useStoreSelect();
  const _userSelect = useUserSelect();
  const _toolSelect = useToolSelect();
  const [rentals, setRentals] = useState([]);
  const [stillOpen, _setStillOpen] = useState(true);
  const [page, _setPage] = useState(1);
  const [orderAsc, _setOrderAsc] = useState(true);
  const [overdueOnly, _setOverdueOnly] = useState(false);

  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);
  const urlToolId = urlParams.get(URL_TOOL_ID_KEY);
  const urlPersonId = urlParams.get(URL_PERSON_ID_KEY);

  const storeSelect = {
    ..._storeSelect,
    addStore: (storeId) => {
      if (urlStoreId) {
        urlParams.delete(URL_STORE_ID_KEY);
        setUrlParams(urlParams);
      }
      _storeSelect.addStore(storeId);
    },
    removeStore: (storeId) => {
      if (urlStoreId) {
        urlParams.delete(URL_STORE_ID_KEY);
        setUrlParams(urlParams);
      }
      _storeSelect.removeStore(storeId);
    },
  };

  const userSelect = {
    ..._userSelect,
    addUser: (userId) => {
      if (urlPersonId) {
        urlParams.delete(URL_PERSON_ID_KEY);
        setUrlParams(urlParams);
      }
      _userSelect.addUser(userId);
    },
    removeUser: (userId) => {
      if (urlPersonId) {
        urlParams.delete(URL_PERSON_ID_KEY);
        setUrlParams(urlParams);
      }
      _userSelect.removeUser(userId);
    },
  };

  const toolSelect = {
    ..._toolSelect,
    addTool: (toolId) => {
      if (urlToolId) {
        urlParams.delete(URL_TOOL_ID_KEY);
        setUrlParams(urlParams);
      }
      _toolSelect.addTool(toolId);
    },
    removeTool: (toolId) => {
      if (urlToolId) {
        urlParams.delete(URL_TOOL_ID_KEY);
        setUrlParams(urlParams);
      }
      _toolSelect.removeTool(toolId);
    },
  };

  // filter by store if urlStoreId is present
  {
    useEffect(() => {
      if (!urlStoreId || !accessToken) return;
      _storeSelect.addStore(urlStoreId);
    }, [urlStoreId, accessToken]);

    const { data } = useSWR(
      !urlStoreId || !accessToken
        ? null
        : `get store ${urlStoreId}, using ${accessToken}`,
      () => endpoints.getStore({ id: urlStoreId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        _storeSelect.setStoreTerm({ target: { value: data.name } });
      }
    }, [data]);
  }

  // filter by person if urlPersonId is present
  {
    useEffect(() => {
      if (!urlPersonId || !accessToken) return;
      _userSelect.addUser(urlPersonId);
    }, [urlPersonId, accessToken]);

    const { data } = useSWR(
      !urlPersonId || !accessToken
        ? null
        : `get user ${urlPersonId}, using ${accessToken}`,
      () => endpoints.getUser({ id: urlPersonId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        _userSelect.setUserTerm({ target: { value: data.username } });
      }
    }, [data]);
  }

  // filter by tool if urlToolId is present
  {
    useEffect(() => {
      if (!urlToolId || !accessToken) return;
      _toolSelect.addTool(urlToolId);
    }, [urlToolId, accessToken]);

    const { data } = useSWR(
      !urlToolId || !accessToken
        ? null
        : `get tool ${urlToolId}, using ${accessToken}`,
      () => endpoints.getTool({ id: urlToolId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        _toolSelect.setToolTerm({ target: { value: data.realId } });
      }
    }, [data]);
  }

  const setOrderAsc = (e) => {
    _setOrderAsc(e.target.checked);
  };

  const endpointParams = {
    storeIds: urlStoreId ? [urlStoreId] : storeSelect.stores.map((s) => s.id),
    renterIds: urlPersonId ? [urlPersonId] : userSelect.users.map((u) => u.id),
    toolIds: urlToolId ? [urlToolId] : toolSelect.tools.map((t) => t.id),
    open: stillOpen,
    page,
    orderAsc,
    ...(overdueOnly ? { overdue: true } : {}),
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
  };

  const setOverdueOnly = (e) => {
    _setOverdueOnly(e.target.checked);
  };

  const prevPage = () => {
    if (page > 1) {
      _setPage(page - 1);
    }
  };

  const nextPage = () => _setPage(page + 1);

  const goToRental = (rentalId) => {
    navigate(`/rentals/${rentalId}`);
  };

  return {
    storeSelect,
    userSelect,
    toolSelect,
    stillOpen,
    setStillOpen,
    orderAsc,
    setOrderAsc,
    overdueOnly,
    setOverdueOnly,
    rentalList: rentals,
    goToRental,
    prevPage,
    nextPage,
    page,
  };
};

export const PureRentals = (rentals) => {
  const {
    storeSelect,
    userSelect,
    toolSelect,
    stillOpen,
    setStillOpen,
    orderAsc,
    setOrderAsc,
    overdueOnly,
    setOverdueOnly,
    rentalList,
    goToRental,
    prevPage,
    nextPage,
    page,
  } = rentals;

  return (
    <div>
      <div className="mb-3 mt-2 flex flex-col gap-x-4 gap-y-2 md:flex-row">
        <div className="mt-1 flex grow-0 gap-4 md:mt-0 md:block">
          <p className="mt-1 md:mt-0">Rentals</p>
          <Checkbox
            label="Still Open"
            checked={stillOpen}
            onChange={setStillOpen}
          />
          <Checkbox
            label="Overdue Only"
            checked={overdueOnly}
            onChange={setOverdueOnly}
          />
          <Checkbox
            label="Order Asc"
            checked={orderAsc}
            onChange={setOrderAsc}
          />
        </div>
        <div className="grid grow grid-cols-1 gap-y-2">
          <PureUserSelect {...userSelect} />
          <PureStoreSelect {...storeSelect} />
          <PureToolSelect {...toolSelect} />
        </div>
      </div>
      <ul>
        {rentalList.map((rental) => (
          <li key={rental.id} onClick={() => goToRental(rental.id)}>
            {JSON.stringify(rental)}
          </li>
        ))}
      </ul>
      <PrevNext prev={prevPage} next={nextPage} pageNumber={page} />
    </div>
  );
};

export const Rentals = () => {
  const rentals = useRentals();
  return <PureRentals {...rentals} />;
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
    !!newUser &&
      setUsers((prev) => [...prev.filter((u) => u.id != userId), newUser]);
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
    <div>
      <SearchSelect
        label="Users"
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
    </div>
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
    !!newTool &&
      setTools((prev) => [...prev.filter((t) => t.id != toolId), newTool]);
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
    <div>
      <SearchSelect
        label="Tools"
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
    </div>
  );
};
