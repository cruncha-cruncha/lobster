import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Link, useSearchParams } from "react-router";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { URL_STORE_ID_KEY } from "./Store";
import { URL_TOOL_ID_KEY } from "./Tool";
import { URL_PERSON_ID_KEY } from "./Person";
import { usePrevNext, PurePrevNext } from "../components/PrevNext";
import { useStoreSelect, PureStoreSelect } from "./Tools";
import { useDebounce } from "../components/useDebounce";

export const useRentals = () => {
  const { accessToken } = useAuth();
  const [urlParams, setUrlParams] = useSearchParams();
  const _storeSelect = useStoreSelect();
  const _userSelect = useUserSelect();
  const _toolSelect = useToolSelect();
  const [rentals, setRentals] = useState([]);
  const [stillOpen, _setStillOpen] = useState(true);
  const pageControl = usePrevNext();
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
      pageControl.setPage(1);
    },
    removeStore: (storeId) => {
      if (urlStoreId) {
        urlParams.delete(URL_STORE_ID_KEY);
        setUrlParams(urlParams);
      }
      _storeSelect.removeStore(storeId);
      pageControl.setPage(1);
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
      pageControl.setPage(1);
    },
    removeUser: (userId) => {
      if (urlPersonId) {
        urlParams.delete(URL_PERSON_ID_KEY);
        setUrlParams(urlParams);
      }
      _userSelect.removeUser(userId);
      pageControl.setPage(1);
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
      pageControl.setPage(1);
    },
    removeTool: (toolId) => {
      if (urlToolId) {
        urlParams.delete(URL_TOOL_ID_KEY);
        setUrlParams(urlParams);
      }
      _toolSelect.removeTool(toolId);
      pageControl.setPage(1);
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
      if (!urlToolId) return;
      _toolSelect.addTool(urlToolId);
    }, [urlToolId]);

    const { data } = useSWR(!urlToolId ? null : `get tool ${urlToolId}`, () =>
      endpoints.getTool({ id: urlToolId }),
    );

    useEffect(() => {
      if (data) {
        _toolSelect.setToolTerm({ target: { value: data.realId } });
      }
    }, [data]);
  }

  const setOrderAsc = (e) => {
    _setOrderAsc(e.target.checked);
    pageControl.setPage(1);
  };

  const endpointParams = {
    storeIds: urlStoreId ? [urlStoreId] : storeSelect.stores.map((s) => s.id),
    renterIds: urlPersonId ? [urlPersonId] : userSelect.users.map((u) => u.id),
    toolIds: urlToolId ? [urlToolId] : toolSelect.tools.map((t) => t.id),
    open: stillOpen,
    page: pageControl.pageNumber,
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
    pageControl.setPage(1);
    if (!e.target.checked) {
      _setOverdueOnly(false);
    }
  };

  const setOverdueOnly = (e) => {
    _setOverdueOnly(e.target.checked);
    pageControl.setPage(1);
    if (e.target.checked) {
      _setStillOpen(true);
    }
  };

  const goToRental = (rentalId) => `/rentals/${rentalId}`;

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
    pageControl,
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
    pageControl,
  } = rentals;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h1 className="mr-2 text-xl">Rentals</h1>
      </div>
      <div className="px-2">
        <p>
          Here you can search for people in the network by username (and/or
          email if you're a user administrator). This page can also be used to
          find all people associated with a store. Click on one of the results
          to see more information about a user, as well as links to their
          rentals and grievances (accused).
        </p>
      </div>
      <div className="mb-3 mt-2 flex flex-col gap-x-4 gap-y-2 px-2 md:flex-row">
        <div className="flex-final mt-0 flex gap-4 md:block">
          <div className="flex flex-wrap items-center gap-x-4 md:flex-col md:items-start">
            <Checkbox
              id="rental-still-open"
              label="Still Open"
              checked={stillOpen}
              onChange={setStillOpen}
            />
            <Checkbox
              id="rental-overdue-only"
              label="Overdue Only"
              checked={overdueOnly}
              onChange={setOverdueOnly}
            />
            <Checkbox
              id="rental-order-asc"
              label="Order Asc"
              checked={orderAsc}
              onChange={setOrderAsc}
            />
          </div>
        </div>
        <div className="grid grow grid-cols-1 gap-y-2">
          <PureUserSelect {...userSelect} />
          <PureStoreSelect {...storeSelect} />
          <PureToolSelect {...toolSelect} />
        </div>
      </div>
      <ul className="mb-3 mt-4 overflow-y-auto border-x-2 border-stone-400 px-2 [&>*:first-child]:mt-1 [&>*:last-child]:mb-1 [&>*]:my-2">
        {rentalList.length == 0 && (
          <li className="text-stone-400">no results</li>
        )}
        {rentalList.map((rental) => (
          <li key={rental.id}>
            <Link to={goToRental(rental.id)} className="mb-2 cursor-pointer">
              {JSON.stringify(rental)}
            </Link>
          </li>
        ))}
      </ul>
      <PurePrevNext {...pageControl} />
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
  const debouncedUserTerm = useDebounce(userTerm, 400);

  const endpointParams = {
    term: debouncedUserTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchUsers({ params: endpointParams, accessToken }),
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
    let alreadySelected = false;
    setUsers((prev) => {
      alreadySelected = prev.find((u) => u.id == userId);
      return prev;
    });
    if (alreadySelected) return;

    let newUser = userOptions.find((u) => u.id == userId);
    if (!newUser) {
      newUser = await endpoints.getUser({ id: userId, accessToken });
      cache.set(`get user ${userId}, using ${accessToken}`, newUser);
    }
    !!newUser &&
      setUsers((prev) => [...prev.filter((u) => u.id != userId), newUser]);
  };

  const removeUser = (userId) => {
    setUsers((prev) => [...prev.filter((u) => u.id != userId)]);
  };

  const clear = () => {
    setUsers([]);
  };

  return {
    users,
    userTerm,
    setUserTerm,
    userOptions: userOptions.map((u) => ({
      id: u.id,
      name: `${u.username}${u.emailAddress ? `, ${u.emailAddress}` : ""}`,
    })),
    removeUser,
    addUser,
    clear,
  };
};

export const PureUserSelect = (userSelect) => {
  const {
    users,
    userTerm,
    setUserTerm,
    userOptions,
    removeUser,
    addUser,
    label = "Users",
  } = userSelect;

  return (
    <div>
      <SearchSelect
        id={`user-select-${label}`}
        label={label}
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
  const { cache } = useSWRConfig();
  const [tools, setTools] = useState([]);
  const [toolTerm, _setToolTerm] = useState("");
  const [toolOptions, setToolOptions] = useState([]);
  const debouncedToolTerm = useDebounce(toolTerm, 400);

  const endpointParams = {
    term: debouncedToolTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    `get tools, using ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchTools({ params: endpointParams }),
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
    let alreadySelected = false;
    setTools((prev) => {
      alreadySelected = prev.find((t) => t.id == toolId);
      return prev;
    });
    if (alreadySelected) return;

    let newTool = toolOptions.find((t) => t.id == toolId);
    if (!newTool) {
      newTool = await endpoints.getTool({ id: toolId });
      cache.set(`get tool ${toolId}`, newTool);
    }
    !!newTool &&
      setTools((prev) => [...prev.filter((t) => t.id != toolId), newTool]);
  };

  const removeTool = (toolId) => {
    setTools((prev) => prev.filter((t) => t.id != toolId));
  };

  return {
    tools,
    toolTerm,
    setToolTerm,
    toolOptions: toolOptions.map((t) => ({
      id: t.id,
      name: `${t.realId}${
        !t.shortDescription.trim() ? "" : `, ${t.shortDescription}`
      }`,
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
        id="tool-select"
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
