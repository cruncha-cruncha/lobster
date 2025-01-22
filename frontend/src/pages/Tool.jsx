import { useEffect, useReducer } from "react";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { URL_STORE_ID_KEY } from "./Store";
import { PureCategorySearch, useCategorySearch } from "./Tools";
import { useToolCart } from "../state/toolCart";
import { eqSet } from "../components/utils";
import { LargeTextInput } from "../components/LargeTextInput";
import { useImageUpload } from "../state/imageUpload";
import { FileSelect } from "../components/FileSelect";

export const URL_TOOL_ID_KEY = "toolId";

const reducer = (state, action) => {
  switch (action.type) {
    case "status":
      return { ...state, status: action.value };
    case "shortDescription":
      return { ...state, shortDescription: action.value };
    case "longDescription":
      return { ...state, longDescription: action.value };
    case "realId":
      return { ...state, realId: action.value };
    case "pictures":
      return { ...state, pictures: action.value };
    case "rentalHours":
      return { ...state, rentalHours: action.value };
    case "isLoading":
      return { ...state, isLoading: action.value };
    case "isSaving":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export const useTool = () => {
  const { accessToken, permissions } = useAuth();
  const params = useParams();
  const { toolStatuses } = useConstants();
  const _categorySearch = useCategorySearch();
  const {
    addPhoto: addNewPhoto,
    removePhoto: removeNewPhoto,
    photos: newPhotos,
    reset: resetNewPhotos,
    getLatest: getLatestNewPhotos,
  } = useImageUpload();
  const { toolCart, addTool, removeTool } = useToolCart();
  const [info, dispatch] = useReducer(reducer, {
    status: "1",
    shortDescription: "",
    longDescription: "",
    realId: "",
    pictures: [],
    rentalHours: 0,
    isLoading: true,
    isSaving: false,
  });
  const toolId = params.id;

  const updateLocalInfo = (data) => {
    dispatch({ type: "status", value: data.status });
    dispatch({ type: "shortDescription", value: data.shortDescription });
    dispatch({ type: "longDescription", value: data.longDescription || "" });
    data.categories.forEach((category) => {
      _categorySearch.addCategory(category.id);
    });
    dispatch({ type: "realId", value: data.realId });
    dispatch({ type: "pictures", value: data.pictures });
    dispatch({
      type: "rentalHours",
      value: data.rentalHours,
    });
    dispatch({ type: "isLoading", value: false });
  };

  const { data, isLoading, error, mutate } = useSWR(`get tool ${toolId}`, () =>
    endpoints.getTool({ id: toolId }),
  );

  useEffect(() => {
    if (data) {
      updateLocalInfo(data);
    }
  }, [data]);

  const goToTools = () => "/tools";

  const goToStoreTools = () => `/tools?${URL_STORE_ID_KEY}=${data?.storeId}`;

  const goToStore = () => `/stores/${data?.storeId}`;

  const setStatus = (e) => {
    dispatch({ type: "status", value: e.target.value });
  };

  const setShortDescription = (e) => {
    dispatch({ type: "shortDescription", value: e.target.value });
  };

  const setLongDescription = (e) => {
    dispatch({ type: "longDescription", value: e.target.value });
  };

  const setRealId = (e) => {
    dispatch({ type: "realId", value: e.target.value });
  };

  const setRentalHours = (e) => {
    dispatch({ type: "rentalHours", value: e.target.value });
  };

  const canAddToCart = !toolCart.some((tool) => tool.id == toolId);
  const canRemoveFromCart = toolCart.some((tool) => tool.id == toolId);

  const addToCart = () => {
    addTool(data);
  };

  const removeFromCart = () => {
    removeTool(toolId);
  };

  const updateTool = async () => {
    dispatch({ type: "isSaving", value: true });

    await Promise.all(
      info.pictures
        .filter((photo) => photo.delete)
        .map((photo) => {
          return endpoints.deletePhoto({ key: photo.photoKey, accessToken });
        }),
    );

    let count = 0;
    const lim = 50;
    let latestNewPhotos = getLatestNewPhotos();
    while (latestNewPhotos.filter((photo) => !photo.key).length > 0) {
      count += 1;
      if (count > lim) {
        throw new Error("Timeout waiting for photos to upload");
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      latestNewPhotos = getLatestNewPhotos();
    }

    const photoKeys = [
      ...info.pictures.filter((p) => !p.delete).map((photo) => photo.photoKey),
      ...latestNewPhotos.map((photo) => photo.key),
    ];

    return endpoints
      .updateTool({
        id: Number(toolId),
        info: {
          realId: info.realId,
          storeId: Number(data.storeId),
          categoryIds: categorySearch.categories.map((cat) => cat.id),
          shortDescription: info.shortDescription,
          longDescription: info.longDescription,
          rentalHours: parseInt(info.rentalHours, 10) || data.rentalHours,
          photoKeys,
          status: Number(info.status),
        },
        accessToken,
      })
      .then((data) => {
        resetNewPhotos();
        mutate(data);
      })
      .finally(() => {
        dispatch({ type: "isSaving", value: false });
      });
  };

  const categorySearch = {
    ..._categorySearch,
    showMatchAllCats: false,
  };

  const goToRentals = () => `/rentals?${URL_TOOL_ID_KEY}=${toolId}`;

  const addNewPhotos = (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addNewPhoto({ name: file.name, file });
    }
  };

  const toggleRemoveExistingPhoto = (id) => {
    const toModify = info.pictures.find((photo) => photo.id == id);
    dispatch({
      type: "pictures",
      value: [
        ...info.pictures.filter((photo) => photo.id != id),
        {
          ...toModify,
          delete: !toModify.delete,
        },
      ],
    });
  };

  const showUpdateTool = permissions.isToolManager(data?.storeId);

  const canUpdateTool =
    info.status != data?.status ||
    info.shortDescription != data?.shortDescription ||
    (info.longDescription != data?.longDescription &&
      !(!info.longDescription && !data?.longDescription)) ||
    info.pictures.filter((photo) => photo.delete).length > 0 ||
    newPhotos.length > 0 ||
    info.realId != data?.realId ||
    info.rentalHours != data?.rentalHours ||
    !eqSet(
      new Set(categorySearch.categories.map((cat) => cat.id)),
      new Set(data?.categories.map((cat) => cat.id) || []),
    );

  return {
    toolId,
    info: {
      ...info,
      pictures: info.pictures.map((photo) => ({
        ...photo,
        url: endpoints.makePhotoThumbnailUrl({ key: photo.photoKey }),
      })),
    },
    newPhotos,
    removeNewPhoto,
    addNewPhotos,
    toggleRemoveExistingPhoto,
    data,
    goToTools,
    goToStoreTools,
    goToStore,
    goToRentals,
    toolStatuses,
    setStatus,
    setShortDescription,
    setLongDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
    isSaving: info.isSaving,
    canUpdateTool,
    showUpdateTool,
  };
};

export const PureTool = (tool) => {
  const {
    toolId,
    info,
    newPhotos,
    removeNewPhoto,
    addNewPhotos,
    toggleRemoveExistingPhoto,
    data,
    goToTools,
    goToStoreTools,
    goToStore,
    goToRentals,
    toolStatuses,
    setStatus,
    setShortDescription,
    setLongDescription,
    setRealId,
    setRentalHours,
    updateTool,
    categorySearch,
    canAddToCart,
    canRemoveFromCart,
    addToCart,
    removeFromCart,
    isSaving,
    canUpdateTool,
    showUpdateTool,
  } = tool;

  return (
    <div>
      <h2 className="mt-2 px-2 text-xl">{data?.realId || "Tool"}</h2>
      <div className="my-2 flex gap-2 px-2">
        <Button text="All Tools" goTo={goToTools()} variant="blue" size="sm" />
        <Button
          text="Store Tools"
          goTo={goToStoreTools()}
          variant="blue"
          size="sm"
        />
        <Button text="Rentals" goTo={goToRentals()} variant="blue" size="sm" />
        <Button text="Store" goTo={goToStore()} variant="blue" size="sm" />
      </div>
      <p className="px-2">{JSON.stringify(data)}</p>
      <div className="flex justify-end gap-2 px-2">
        {canAddToCart && (
          <Button text="Add to Cart" onClick={() => addToCart(toolId)} />
        )}
        {canRemoveFromCart && (
          <Button
            text="Remove from Cart"
            onClick={() => removeFromCart(toolId)}
            variant="red"
          />
        )}
      </div>
      {showUpdateTool && (
        <>
          <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
            <TextInput
              id={`tool-short-description`}
              label="Short Description"
              value={info.shortDescription}
              onChange={setShortDescription}
            />
            <TextInput
              id={`tool-real-id`}
              label="Real ID"
              value={info.realId}
              onChange={setRealId}
            />
            <div className="md:col-span-2">
              <LargeTextInput
                id="tool-long-description"
                label="Long Description"
                value={info.longDescription}
                onChange={setLongDescription}
              />
            </div>
            <div className="md:col-span-2">
              <PureCategorySearch {...categorySearch} />
            </div>
            <div className="md:col-span-2">
              <FileSelect
                id="tool-photos"
                label="Photos"
                onChange={addNewPhotos}
              />
              <ul>
                {info.pictures.map((photo) => (
                  <li key={photo.id}>
                    <div
                      className="my-2 flex cursor-pointer items-center gap-2"
                      onClick={() => toggleRemoveExistingPhoto(photo.id)}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className={
                          "h-12" + (!photo.delete ? "" : " opacity-50")
                        }
                      />
                      <span className={!photo.delete ? "" : "text-stone-400"}>
                        {JSON.stringify(photo)}
                      </span>
                    </div>
                  </li>
                ))}
                {newPhotos.map((photo) => (
                  <li key={photo.id}>
                    <div
                      className="my-2 flex cursor-pointer items-center"
                      onClick={() => removeNewPhoto(photo.id)}
                    >
                      <img src={photo.url} alt="" className="h-12" />
                      <span className="ml-2">{photo.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <TextInput
              id={`tool-rental-hours`}
              label="Rental Hours"
              value={info.rentalHours || ""}
              onChange={setRentalHours}
            />
            <Select
              id={`tool-status`}
              label="Status"
              value={info.status}
              options={toolStatuses}
              onChange={setStatus}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2 px-2">
            <Button
              text="Update"
              onClick={updateTool}
              isLoading={isSaving}
              disabled={!canUpdateTool}
            />
          </div>
        </>
      )}
    </div>
  );
};

export const Tool = () => {
  const tool = useTool();
  return <PureTool {...tool} />;
};
