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

export const buildToolList = (data) => {
  return data.tools.map((tool) => {
    const store = data.stores.find((store) => store.id == tool.storeId);
    const categories = tool.classifications.map((catId) =>
      data.categories.find((cat) => cat.id == catId),
    );

    return {
      ...tool,
      storeName: store.name,
      categories,
    };
  });
};

export const useTools = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const urlStoreId = urlParams.get(URL_STORE_ID_KEY);
  const { toolCart, addTool, removeTool, inCart } = useToolCart();

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
      if (urlStoreId) {
        urlParams.delete(URL_STORE_ID_KEY);
        setUrlParams(urlParams);
      }
      _storeSelect.removeStore(storeId);
    },
  };

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

  const endpointParams = {
    term: searchTerm,
    storeIds: urlStoreId
      ? [urlStoreId]
      : storeSelect.stores.map((store) => store.id),
    statuses: status === "0" ? "" : [parseInt(status, 10)],
    categories: categorySearch.categories.map((cat) => cat.id),
    matchAllCategories: categorySearch.matchAllCats,
    page,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get tools, using ${accessToken} and ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchTools({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setToolsList(buildToolList(data));
    }
  }, [data]);

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const setSearchTerm = (e) => {
    _setSearchTerm(e.target.value);
  };

  const goToTool = (toolId) => {
    navigate(`/tools/${toolId}`);
  };

  const prevPage = () => {
    if (page > 1) {
      _setPage(page - 1);
    }
  };

  const nextPage = () => _setPage(page + 1);

  const addToCart = (toolId) => {
    addTool(toolsList.find((tool) => tool.id == toolId));
  };

  const removeFromCart = (toolId) => {
    removeTool(toolId);
  };

  const goToCart = () => {
    navigate("/cart");
  };

  return {
    toolStatuses: [{ id: "0", name: "All" }, ...toolStatuses],
    status,
    setStatus,
    searchTerm,
    setSearchTerm,
    categorySearch,
    storeSelect,
    toolsList: toolsList.map((tool) => ({
      ...tool,
      canAddToCart: !inCart(tool.id),
      canRemoveFromCart: inCart(tool.id),
    })),
    goToTool,
    warnSingleStore: !!urlStoreId,
    prevPage,
    nextPage,
    page,
    addToCart,
    removeFromCart,
    showGoToCart: toolCart.length > 0,
    goToCart,
    cartSize: toolCart.length,
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
    prevPage,
    nextPage,
    page,
    addToCart,
    removeFromCart,
    showGoToCart,
    goToCart,
    cartSize,
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
      {warnSingleStore && <p>currently filtering by a store</p>}
      {showGoToCart && (
        <div>
          <Button
            onClick={goToCart}
            text={`Cart (${cartSize})`}
            variant="blue"
          />
        </div>
      )}
      <ul>
        {toolsList.map((tool) => (
          <li key={tool.id}>
            <div className="flex justify-between">
              <div onClick={() => goToTool(tool.id)} className="cursor-pointer">
                <p>
                  {tool.realId}, {tool.description}
                </p>
                {/* <p>pictures: {JSON.stringify(tool.pictures)}</p> */}
              </div>
              <div className="flex gap-2">
                {tool.canAddToCart && (
                  <Button onClick={() => addToCart(tool.id)} text="Add" />
                )}
                {tool.canRemoveFromCart && (
                  <Button
                    onClick={() => removeFromCart(tool.id)}
                    text="Remove"
                    variant="red"
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <PrevNext prev={prevPage} next={nextPage} pageNumber={page} />
    </div>
  );
};

export const useCategorySearch = () => {
  const { accessToken } = useAuth();
  const { cache } = useSWRConfig();
  const { toolCategories: allCategories } = useToolCategories();
  const [categories, setCategories] = useState([]);
  const [categoryTerm, _setCategoryTerm] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [matchAllCats, _setMatchAllCats] = useState(true);

  const endPointParams = {
    term: categoryTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get categories, using ${accessToken} and ${JSON.stringify(
          endPointParams,
        )}`,
    () =>
      endpoints.searchToolCategories({ params: endPointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setCategoryOptions(data.categories);
    }
  }, [data]);

  const setCategoryTerm = (e) => {
    _setCategoryTerm(e.target.value);
  };

  const addCategory = async (catId) => {
    if (categories.find((c) => c.id == catId)) return;
    let newCat = allCategories.find((c) => c.id == catId);
    if (!newCat) {
      newCat = categoryOptions.find((c) => c.id == catId);
      if (!newCat) {
        newCat = await endpoints.getToolCategory({ id: catId, accessToken });
        cache.set(`get category ${catId}, using ${accessToken}`, newCat);
      }
    }
    !!newCat &&
      setCategories((prev) => [...prev.filter((c) => c.id != catId), newCat]);
  };

  const removeCategory = (catId) => {
    setCategories(categories.filter((c) => c.id != catId));
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
      <SearchSelect
        label="Category"
        value={categoryTerm}
        onChange={setCategoryTerm}
        options={categoryOptions}
        onSelect={addCategory}
        showLastSelected={false}
      />
      <ul>
        {categories.map((cat) => (
          <li key={cat.id} onClick={() => removeCategory(cat.id)}>
            {JSON.stringify(cat)}
          </li>
        ))}
      </ul>
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
  const { cache } = useSWRConfig();
  const [stores, setStores] = useState([]);
  const [storeTerm, _setStoreTerm] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);

  const endpointParams = {
    term: storeTerm,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get stores, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.getStores({ params: endpointParams, accessToken }),
  );

  useEffect(() => {
    if (data) {
      setStoreOptions(data.stores);
    }
  }, [data]);

  const setStoreTerm = (e) => {
    _setStoreTerm(e.target.value);
  };

  const addStore = async (storeId) => {
    if (stores.find((s) => s.id == storeId)) return;
    let newStore = storeOptions.find((s) => s.id == storeId);
    if (!newStore) {
      newStore = await endpoints.getStore({ id: storeId, accessToken });
      cache.set(`get store ${storeId}, using ${accessToken}`, newStore);
    }
    !!newStore &&
      setStores((prev) => [...prev.filter((s) => s.id != storeId), newStore]);
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
      <SearchSelect
        label="Store"
        value={storeTerm}
        onChange={setStoreTerm}
        options={storeOptions}
        onSelect={addStore}
        showLastSelected={false}
      />
      <ul>
        {stores.map((store) => (
          <li key={store.id} onClick={() => removeStore(store.id)}>
            {JSON.stringify(store)}
          </li>
        ))}
      </ul>
    </>
  );
};

export const Tools = () => {
  const tools = useTools();
  return <PureTools {...tools} />;
};
