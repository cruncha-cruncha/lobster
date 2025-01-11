import { useState, useEffect } from "react";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { URL_STORE_ID_KEY } from "./Store";
import { useToolCategories } from "../state/toolCategories";

export const buildToolList = (data) => {
  return data.tools.map((tool) => {
    const store = data.stores.find((store) => store.id == tool.storeId);
    return {
      ...tool,
      storeName: store.name,
    };
  });
};

export const useTools = () => {
  // search for tools
  // edit tools button, dropdown store search (or go directly to store if you only have one? get store titles for store roles we have?)

  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);

  const { toolStatuses } = useConstants();
  const [toolsList, setToolsList] = useState([]);

  const [status, _setStatus] = useState("1");
  const [searchTerm, _setSearchTerm] = useState("");
  const [page, _setPage] = useState(1);

  const categorySearch = useCategorySearch();
  const _storeSelect = useStoreSelect();

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
      if (urlStoreId == storeId) {
        urlParams.delete(URL_STORE_ID_KEY);
        setUrlParams(urlParams);
      }
      _storeSelect.removeStore(storeId);
    },
  };

  useEffect(() => {
    if (!urlStoreId || !accessToken) return;
    _storeSelect.addStore(urlStoreId);
    endpoints.getStore({ id: urlStoreId, accessToken }).then((data) => {
      storeSelect.setStoreTerm({ target: { value: data.name } });
    });
  }, [urlStoreId, accessToken, storeSelect.stores]);

  const fetchTools = () => {
    if (!accessToken) return;
    return endpoints
      .searchTools({
        params: {
          term: searchTerm,
          storeIds: urlStoreId
            ? [urlStoreId]
            : storeSelect.stores.map((store) => store.id),
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
    storeSelect.stores,
    accessToken,
  ]);

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const setSearchTerm = (e) => {
    _setSearchTerm(e.target.value);
  };

  const goToTool = (toolId) => {
    navigate(`/tools/${toolId}`);
  };

  return {
    toolStatuses: [{ id: "0", name: "All" }, ...toolStatuses],
    status,
    setStatus,
    searchTerm,
    setSearchTerm,
    categorySearch,
    storeSelect,
    toolsList,
    goToTool,
    warnSingleStore: !!urlStoreId,
  };
};

export const PureTools = (tools) => {
  const {
    toolStatuses,
    status,
    setStatus,
    searchTerm,
    setSearchTerm,
    categorySearch,
    storeSelect,
    toolsList,
    goToTool,
    warnSingleStore,
  } = tools;

  return (
    <div>
      <h1>Tools</h1>
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
      <PureStoreSelect {...storeSelect} />
      {warnSingleStore && <p>currently filtering by store</p>}
      <ul>
        {toolsList.map((tool) => (
          <li key={tool.id} onClick={() => goToTool(tool.id)}>
            {JSON.stringify(tool)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const useCategorySearch = () => {
  const { accessToken } = useAuth();
  const { toolCategories: allCategories } = useToolCategories();
  const [categories, setCategories] = useState([]);
  const [categoryTerm, _setCategoryTerm] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [matchAllCats, _setMatchAllCats] = useState(true);

  const fetchCategories = () => {
    if (!accessToken) return;
    return endpoints
      .searchToolCategories({
        params: {
          term: categoryTerm,
        },
        accessToken,
      })
      .then((data) => {
        setCategoryOptions(data.categories);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, [categoryTerm, accessToken]);

  const setCategoryTerm = (e) => {
    _setCategoryTerm(e.target.value);
  };

  const addCategory = async (catId) => {
    if (categories.find((c) => c.id == catId)) return;
    const newCat = allCategories.find((c) => c.id == catId);
    if (!newCat) {
      console.error("category not found");
      return;
    }
    setCategories([...categories, newCat]);
  };

  const removeCategory = (catId) => {
    setCategories(categories.filter((cat) => cat.id != catId));
  };

  const setMatchAllCats = (e) => {
    _setMatchAllCats(e.target.checked);
  };

  return {
    categories,
    categoryTerm,
    setCategoryTerm,
    categoryOptions,
    removeCategory,
    addCategory,
    showMatchAllCats: true,
    matchAllCats,
    setMatchAllCats,
  };
};

export const PureCategorySearch = (categorySearch) => {
  const {
    categories,
    categoryTerm,
    setCategoryTerm,
    categoryOptions,
    removeCategory,
    addCategory,
    showMatchAllCats,
    matchAllCats,
    setMatchAllCats,
  } = categorySearch;

  return (
    <>
      <p>Categories</p>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id} onClick={() => removeCategory(cat.id)}>
            {JSON.stringify(cat)}
          </li>
        ))}
      </ul>
      <SearchSelect
        label="Category"
        value={categoryTerm}
        onChange={setCategoryTerm}
        options={categoryOptions}
        onSelect={addCategory}
        showLastSelected={false}
      />
      {showMatchAllCats && (
        <Checkbox
          label="Match All Categories"
          checked={matchAllCats}
          onChange={setMatchAllCats}
        />
      )}
    </>
  );
};

export const useStoreSelect = () => {
  const { accessToken } = useAuth();
  const [stores, setStores] = useState([]);
  const [storeTerm, _setStoreTerm] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);

  const fetchStores = () => {
    if (!accessToken) return;
    return endpoints
      .getStores({
        params: {
          term: storeTerm,
        },
        accessToken,
      })
      .then((data) => {
        setStoreOptions(data.stores);
      });
  };

  useEffect(() => {
    fetchStores();
  }, [storeTerm, accessToken]);

  const setStoreTerm = (e) => {
    _setStoreTerm(e.target.value);
  };

  const addStore = async (storeId) => {
    if (stores.find((s) => s.id == storeId)) return;
    let newStore = storeOptions.find((s) => s.id == storeId);
    if (!newStore) {
      newStore = await endpoints.getStore({ id: storeId, accessToken });
    }
    setStores([...stores, newStore]);
  };

  const removeStore = (storeId) => {
    setStores(stores.filter((s) => s.id != storeId));
  };

  return {
    stores,
    storeTerm,
    setStoreTerm,
    storeOptions,
    removeStore,
    addStore,
  };
};

export const PureStoreSelect = (storeSelect) => {
  const {
    stores,
    storeTerm,
    setStoreTerm,
    storeOptions,
    removeStore,
    addStore,
  } = storeSelect;

  return (
    <>
      <p>Stores</p>
      <ul>
        {stores.map((store) => (
          <li key={store.id} onClick={() => removeStore(store.id)}>
            {JSON.stringify(store)}
          </li>
        ))}
      </ul>
      <SearchSelect
        label="Store"
        value={storeTerm}
        onChange={setStoreTerm}
        options={storeOptions}
        onSelect={addStore}
        showLastSelected={false}
      />
    </>
  );
};

export const Tools = () => {
  const tools = useTools();
  return <PureTools {...tools} />;
};
