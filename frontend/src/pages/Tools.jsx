import { useState, useEffect } from "react";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";

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
  const params = useParams();
  const { toolStatuses } = useConstants();
  const [toolsList, setToolsList] = useState([]);

  const [status, _setStatus] = useState("1");
  const [searchTerm, _setSearchTerm] = useState("");
  const [page, _setPage] = useState(1);

  const categorySearch = useCategorySearch();
  const storeSelect = useStoreSelect();

  const fetchTools = () => {
    endpoints
      .searchTools({
        params: {
          term: searchTerm,
          storeIds: storeSelect.stores.map((store) => store.id),
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
  ]);

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const setSearchTerm = (e) => {
    _setSearchTerm(e.target.value);
  };

  return {
    toolStatuses,
    status,
    setStatus,
    searchTerm,
    setSearchTerm,
    categorySearch,
    storeSelect,
    toolsList,
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
      <ul>
        {toolsList.map((tool) => (
          <li key={tool.id}>{JSON.stringify(tool)}</li>
        ))}
      </ul>
    </div>
  );
};

export const useCategorySearch = () => {
  const { accessToken } = useAuth();
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
  }, [categoryTerm]);

  const setCategoryTerm = (e) => {
    _setCategoryTerm(e.target.value);
  };

  const addCategory = (catId) => {
    const newCat = categoryOptions.find((c) => c.id == catId);
    if (categories.find((cat) => cat.id == newCat.id)) return;
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
    endpoints
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
  }, [storeTerm]);

  const setStoreTerm = (e) => {
    _setStoreTerm(e.target.value);
  };

  const addStore = (storeId) => {
    const newStore = storeOptions.find((s) => s.id == storeId);
    if (stores.find((s) => s.id == newStore.id)) return;
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
