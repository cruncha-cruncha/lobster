import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { PureCategorySearch, buildToolList } from "./Tools";
import { useCategorySearch } from "./Tools";

export const StoreTools = () => {
  const storeToolSearch = useStoreToolSearch();
  const addTool = useAddTool();

  return (
    <>
      <PureStoreToolSearch {...storeToolSearch} />
      <PureAddTool {...addTool} />
    </>
  );
};

export const useStoreToolSearch = () => {
  const params = useParams();
  const { toolStatuses } = useConstants();
  const { accessToken } = useAuth();
  const [toolsList, setToolsList] = useState([]);
  const storeId = params.id;

  const [status, _setStatus] = useState("1");
  const [searchTerm, _setSearchTerm] = useState("");
  const [page, _setPage] = useState(1);
  const categorySearch = useCategorySearch();

  const fetchTools = () => {
    endpoints
      .searchTools({
        params: {
          term: searchTerm,
          storeIds: [storeId],
          statuses: status === "0" ? "" : [parseInt(status, 10)],
          categories: categorySearch.categories.map((cat) => cat.id),
          matchAllCategories: categorySearch.matchAllCats,
          page,
        },
        accessToken,
      })
      .then((data) => {
        setToolsList(buildToolList(data));
      });
  };

  useEffect(() => {
    fetchTools();
  }, [
    page,
    status,
    searchTerm,
    categorySearch.categories,
    categorySearch.matchAllCats,
  ]);

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const setSearchTerm = (e) => {
    _setSearchTerm(e.target.value);
  };

  return {
    status,
    setStatus,
    toolStatuses: [{ value: "0", name: "All" }, ...toolStatuses],
    searchTerm,
    setSearchTerm,
    categorySearch,
    toolsList,
  };
};

export const PureStoreToolSearch = (storeToolSearch) => {
  const {
    status,
    setStatus,
    toolStatuses,
    searchTerm,
    setSearchTerm,
    categorySearch,
    toolsList,
  } = storeToolSearch;

  return (
    <div>
      <h1>Store Tools</h1>
      <Select
        label="Status"
        value={status}
        onChange={setStatus}
        options={toolStatuses}
      />
      <TextInput
        label="Search Term"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="screw driver"
      />
      <PureCategorySearch {...categorySearch} />
      <ul>
        {toolsList.map((tool) => (
          <li key={tool.id}>{JSON.stringify(tool)}</li>
        ))}
      </ul>
    </div>
  );
};

export const useAddTool = () => {
  const params = useParams();
  const { accessToken } = useAuth();
  const [realId, _setRealId] = useState("");
  const [description, _setDescription] = useState("");
  const categorySearch = useCategorySearch();

  // default rental period
  // pictures

  const setRealId = (e) => {
    _setRealId(e.target.value);
  };

  const setDescription = (e) => {
    _setDescription(e.target.value);
  };

  // const showAddTool = if user is tool manager for store

  const canAddTool = true;
  // realId !== "" && description !== "" && categories.length > 0;

  const createTool = () => {
    endpoints
      .createTool({
        info: {
          realId,
          storeId: Number(params.id),
          categoryIds: [],
          description,
          pictures: [],
          status: 1,
        },
        accessToken,
      })
      .then((data) => {
        console.log(data);
      });
  };

  return {
    realId,
    setRealId,
    description,
    setDescription,
    categorySearch: {
      ...categorySearch,
      showMatchAllCats: false,
    },
    createTool,
    canAddTool,
  };
};

export const PureAddTool = (addTool) => {
  const {
    realId,
    setRealId,
    description,
    setDescription,
    categorySearch,
    createTool,
    canAddTool,
  } = addTool;

  return (
    <div>
      <p>New Tool</p>
      <TextInput
        label="Real ID"
        value={realId}
        onChange={setRealId}
        placeholder="X5J2"
      />
      <TextInput
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="A red screw driver, square head"
      />
      <PureCategorySearch {...categorySearch} />
      <Button onClick={createTool} text="Add Tool" disabled={!canAddTool} />
    </div>
  );
};
