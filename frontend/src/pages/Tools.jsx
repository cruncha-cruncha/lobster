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
    `get tools, using ${JSON.stringify(endpointParams)}`,
    () => endpoints.searchTools({ params: endpointParams }),
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
      <div className="mt-2 flex items-center gap-2 px-2">
        <h2 className="mr-2 text-xl">Tools</h2>
        <div
          className={
            "flex justify-start gap-2" + (showGoToCart ? "" : " invisible")
          }
        >
          <Button
            onClick={goToCart}
            text={`Cart (${cartSize})`}
            variant="blue"
            size="sm"
          />
        </div>
      </div>
      <div className="mb-3 mt-1 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <TextInput
          label="Search"
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="screwdriver"
        />
        <PureCategorySearch {...categorySearch} />
        <PureStoreSelect {...storeSelect} />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={toolStatuses}
        />
      </div>
      {warnSingleStore && <p>currently filtering by a store</p>}
      <ul className="mb-3 mt-4 border-x-2 border-stone-400 px-2">
        {toolsList.length == 0 && (
          <li className="text-stone-400">no results</li>
        )}
        {toolsList.map((tool) => (
          <li key={tool.id} className="mb-2 flex justify-between">
            <div
              onClick={() => goToTool(tool.id)}
              className="flex cursor-pointer items-center"
            >
              <p>
                {tool.realId}{!tool.shortDescription.trim() ? "" : `, ${tool.shortDescription}`}
              </p>
              {/* <p>pictures: {JSON.stringify(tool.pictures)}</p> */}
            </div>
            <div className="flex gap-2">
              {tool.canAddToCart && (
                <Button
                  onClick={() => addToCart(tool.id)}
                  text="Add"
                  size="sm"
                />
              )}
              {tool.canRemoveFromCart && (
                <Button
                  onClick={() => removeFromCart(tool.id)}
                  text="Remove"
                  variant="red"
                  size="sm"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      <PrevNext prev={prevPage} next={nextPage} pageNumber={page} />
    </div>
  );
};

export const useCategorySearch = () => {
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
    `get tool categories, using ${JSON.stringify(endPointParams)}`,
    () => endpoints.searchToolCategories({ params: endPointParams }),
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
        newCat = await endpoints.getToolCategory({ id: catId });
        cache.set(`get tool category ${catId}`, newCat);
      }
    }
    !!newCat &&
      setCategories((prev) => [...prev.filter((c) => c.id != catId), newCat]);
  };

  const removeCategory = (catId) => {
    setCategories((prev) => prev.filter((c) => c.id != catId));
  };

  const setMatchAllCats = (e) => {
    _setMatchAllCats(e.target.checked);
  };

  const clear = () => {
    setCategories([]);
    _setCategoryTerm("");
  }

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
    clear,
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
    <div>
      <div className="flex gap-2">
        <div className="grow">
          <SearchSelect
            label="Categories"
            value={categoryTerm}
            onChange={setCategoryTerm}
            options={categoryOptions}
            onSelect={addCategory}
            showLastSelected={false}
          />
        </div>
        {showMatchAllCats && (
          <div className="flex-final">
            <label>&nbsp;</label>
            <div className="[&_fieldset]:mt-0 [&_label]:border-2 [&_label]:border-transparent [&_label]:py-1">
              <Checkbox
                id="tool-categories-match-all"
                label="Match All"
                checked={matchAllCats}
                onChange={setMatchAllCats}
              />
            </div>
          </div>
        )}
      </div>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id} onClick={() => removeCategory(cat.id)}>
            {JSON.stringify(cat)}
          </li>
        ))}
      </ul>
    </div>
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
    () => endpoints.searchStores({ params: endpointParams, accessToken }),
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
      cache.set(`get store ${storeId}`, newStore);
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
    <div>
      <SearchSelect
        label="Stores"
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
    </div>
  );
};

export const Tools = () => {
  const tools = useTools();
  return <PureTools {...tools} />;
};
