import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { useCategorySearch, PureCategorySearch } from "./Tools";
import { useToolCart } from "../state/toolCart";
import { LargeTextInput } from "../components/LargeTextInput";
import { FileSelect } from "../components/FileSelect";
import { useImageUpload } from "../state/imageUpload";

export const URL_STORE_ID_KEY = "storeId";

export const useStore = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { toolCart } = useToolCart();
  const { accessToken, permissions } = useAuth();
  const storeId = params.id;

  const { data, error, isLoading } = useSWR(
    !accessToken ? null : `get store ${storeId}, using ${accessToken}`,
    () => endpoints.getStore({ id: storeId, accessToken }),
  );

  const goToStores = () => {
    navigate("/stores");
  };

  const goToPeople = () => {
    navigate(`/people?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const goToTools = () => {
    navigate(`/tools?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const cartSize = toolCart.filter((tool) => tool.storeId == storeId).length;

  const goToCart = () => {
    navigate(`/stores/${storeId}/cart`);
  };

  const goToRentals = () => {
    navigate(`/rentals?${URL_STORE_ID_KEY}=${storeId}`);
  };

  const showEditStore = permissions.isStoreRep(storeId);
  const showEditStoreStatus = permissions.isStoreAdmin();
  const showAddTool = permissions.isToolManager(storeId) && data?.status == 1;

  return {
    data,
    storeId,
    storeName: data?.name || "Store",
    goToStores,
    goToRentals,
    goToPeople,
    goToTools,
    goToCart,
    cartSize,
    showEditStore,
    showEditStoreStatus,
    showAddTool,
  };
};

export const PureStore = (store) => {
  const {
    data,
    storeId,
    storeName,
    goToStores,
    goToRentals,
    goToPeople,
    goToTools,
    goToCart,
    cartSize,
    showEditStore,
    showEditStoreStatus,
    showAddTool,
  } = store;

  return (
    <div>
      <h1 className="mt-2 px-2 text-xl">{storeName}</h1>
      <div className="my-2 flex flex-wrap justify-start gap-2 px-2">
        <Button
          onClick={() => goToTools()}
          text="Tools"
          variant="blue"
          size="sm"
        />
        <Button
          onClick={() => goToRentals()}
          text="Rentals"
          variant="blue"
          size="sm"
        />
        <Button
          onClick={() => goToPeople()}
          text="People"
          variant="blue"
          size="sm"
        />
        <Button
          onClick={() => goToStores()}
          text="All Stores"
          variant="blue"
          size="sm"
        />
        <Button
          onClick={goToCart}
          text={`Cart (${cartSize})`}
          variant="blue"
          size="sm"
        />
      </div>
      <p className="px-2">{JSON.stringify(data)}</p>
      {showEditStore && <EditStore storeId={storeId} />}
      {showEditStoreStatus && <EditStoreStatus storeId={storeId} />}
      {showAddTool && <AddTool storeId={storeId} />}
    </div>
  );
};

const editStoreReducer = (state, action) => {
  switch (action.type) {
    case "name":
      return { ...state, name: action.value };
    case "location":
      return { ...state, location: action.value };
    case "emailAddress":
      return { ...state, emailAddress: action.value };
    case "phoneNumber":
      return { ...state, phoneNumber: action.value };
    case "rentalInformation":
      return { ...state, rentalInformation: action.value };
    case "otherInformation":
      return { ...state, otherInformation: action.value };
    default:
      return state;
  }
};

export const useEditStore = ({ storeId }) => {
  const { accessToken, permissions } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [info, infoDispatch] = useReducer(editStoreReducer, {
    name: "",
    location: "",
    emailAddress: "",
    phoneNumber: "",
    rentalInformation: "",
    otherInformation: "",
  });

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get store ${storeId}, using ${accessToken}`,
    () => endpoints.getStore({ id: storeId, accessToken }),
  );

  useEffect(() => {
    if (data) {
      infoDispatch({ type: "name", value: data.name });
      infoDispatch({ type: "location", value: data.location });
      infoDispatch({ type: "emailAddress", value: data.emailAddress });
      infoDispatch({ type: "phoneNumber", value: data.phoneNumber });
      infoDispatch({
        type: "rentalInformation",
        value: data.rentalInformation,
      });
      infoDispatch({ type: "otherInformation", value: data.otherInformation });
    }
  }, [data]);

  const setName = (e) => infoDispatch({ type: "name", value: e.target.value });
  const setLocation = (e) =>
    infoDispatch({ type: "location", value: e.target.value });
  const setEmailAddress = (e) =>
    infoDispatch({ type: "emailAddress", value: e.target.value });
  const setPhoneNumber = (e) =>
    infoDispatch({ type: "phoneNumber", value: e.target.value });
  const setRentalInformation = (e) =>
    infoDispatch({ type: "rentalInformation", value: e.target.value });
  const setOtherInformation = (e) =>
    infoDispatch({ type: "otherInformation", value: e.target.value });

  const canUpdate =
    !isLoading &&
    (data?.name != info.name ||
      data?.location != info.location ||
      data?.emailAddress != info.emailAddress ||
      data?.phoneNumber != info.phoneNumber ||
      data?.rentalInformation != info.rentalInformation ||
      data?.otherInformation != info.otherInformation);

  const handleUpdate = () => {
    setIsSaving(true);
    const payload = {
      name: info.name,
      location: info.location,
      emailAddress: info.emailAddress,
      phoneNumber: info.phoneNumber,
      rentalInformation: info.rentalInformation,
      otherInformation: info.otherInformation,
    };

    endpoints
      .updateStore({
        id: Number(storeId),
        info: payload,
        accessToken,
      })
      .then((data) => {
        mutate(data);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return {
    info,
    setName,
    setLocation,
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canUpdate,
    handleUpdate,
    isSaving,
  };
};

export const PureEditStore = (editStore) => {
  const {
    info,
    setName,
    setLocation,
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canUpdate,
    handleUpdate,
    isSaving,
  } = editStore;

  return (
    <div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
        <TextInput
          id={`store-name`}
          label="Name"
          value={info.name}
          onChange={setName}
          placeholder="Maple Key Tools"
        />
        <TextInput
          id={`store-location`}
          label="Location"
          value={info.location}
          onChange={setLocation}
          placeholder="123 Main St, Ottawa, ON, K1R 7T7"
        />
        <TextInput
          id={`store-email-address`}
          label="Email Address"
          value={info.emailAddress}
          onChange={setEmailAddress}
          placeholder="store-contact@example.com"
        />
        <TextInput
          id={`store-phone-number`}
          label="Phone Number"
          value={info.phoneNumber}
          onChange={setPhoneNumber}
          placeholder="216-245-2368"
        />
        <div className="md:col-span-2">
          <LargeTextInput
            id="store-tool-rental-information"
            label="Read Before Renting"
            value={info.rentalInformation}
            onChange={setRentalInformation}
            placeholder="By appointment only ..."
          />
        </div>
        <div className="md:col-span-2">
          <TextInput
            id="store-other-information"
            label="Other Information"
            value={info.otherInformation}
            onChange={setOtherInformation}
            placeholder=""
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 px-2">
        <Button
          text="Update"
          disabled={!canUpdate}
          onClick={handleUpdate}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
};

export const EditStore = (params) => {
  const editStore = useEditStore(params);
  return <PureEditStore {...editStore} />;
};

export const useEditStoreStatus = ({ storeId }) => {
  const { accessToken, permissions } = useAuth();
  const { storeStatuses } = useConstants();
  const [status, _setStatus] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get store ${storeId}, using ${accessToken}`,
    () => endpoints.getStore({ id: storeId, accessToken }),
  );

  useEffect(() => {
    if (data) {
      _setStatus((prev) => (prev === 0 ? data.status : prev));
    }
  }, [data]);

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    endpoints
      .updateStoreStatus({
        id: storeId,
        status: Number(status),
        accessToken,
      })
      .then((data) => {
        mutate(data);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const canEditStatus = !isLoading && status != data?.status;

  return {
    status,
    setStatus,
    storeStatuses,
    handleUpdate,
    canEditStatus,
    isUpdating,
  };
};

export const PureEditStoreStatus = (editStoreStatus) => {
  const {
    status,
    setStatus,
    storeStatuses,
    handleUpdate,
    canEditStatus,
    isUpdating,
  } = editStoreStatus;

  return (
    <div className="px-2">
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
        <Select
          id={`store-status`}
          label="Status"
          options={storeStatuses}
          value={status}
          onChange={setStatus}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          onClick={handleUpdate}
          text="Update Status"
          disabled={!canEditStatus}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
};

export const EditStoreStatus = (params) => {
  const editStoreStatus = useEditStoreStatus(params);
  return <PureEditStoreStatus {...editStoreStatus} />;
};

export const useAddTool = ({ storeId }) => {
  const defaultRentalHours = 48;
  const { accessToken } = useAuth();
  const [realId, _setRealId] = useState("");
  const [shortDescription, _setShortDescription] = useState("");
  const [longDescription, _setDescription] = useState("");
  const { addPhoto, removePhoto, photos, clear: clearPhotos } = useImageUpload();
  const [rentalHours, _setRentalHours] = useState(defaultRentalHours);
  const [isSaving, setIsSaving] = useState(false);
  const _categorySearch = useCategorySearch();

  const setRealId = (e) => {
    _setRealId(e.target.value);
  };

  const setShortDescription = (e) => {
    _setShortDescription(e.target.value);
  };

  const setLongDescription = (e) => {
    _setDescription(e.target.value);
  };

  const setRentalHours = (e) => {
    _setRentalHours(e.target.value);
  };

  const canAddTool =
    realId !== "" &&
    shortDescription !== "" &&
    _categorySearch.categories.length > 0;

  const createTool = async ({ redirect = true } = {}) => {
    setIsSaving(true);

    let count = 0;
    const lim = 50;
    while (photos.filter((photo) => !photo.key).length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      count += 1;
      if (count > lim) {
        throw new Error("Timeout waiting for photos to upload");
      }
    }

    return endpoints
      .createTool({
        info: {
          realId,
          storeId: Number(storeId),
          categoryIds: [],
          shortDescription,
          longDescription,
          rentalHours: parseInt(rentalHours, 10) || defaultRentalHours,
          photoKeys: photos.map((photo) => photo.key),
          status: 1,
        },
        accessToken,
      })
      .then((data) => {
        _setShortDescription("");
        _setLongDescription("");
        clearPhotos();
        _categorySearch.clear();
        _setRealId("");
        _setRentalHours(defaultRentalHours);

        if (redirect) {
          navigate(`/tools/${data.id}`);
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const addPhotos = (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addPhoto({ name: file.name, file });
    }
  };

  return {
    realId,
    setRealId,
    shortDescription,
    setShortDescription,
    longDescription,
    setLongDescription,
    rentalHours,
    setRentalHours,
    defaultRentalHours,
    categorySearch: {
      ..._categorySearch,
      showMatchAllCats: false,
    },
    createTool,
    canAddTool,
    isSaving,
    photos,
    addPhotos,
    removePhoto,
  };
};

export const PureAddTool = (addTool) => {
  const {
    realId,
    setRealId,
    shortDescription,
    setShortDescription,
    longDescription,
    setLongDescription,
    rentalHours,
    setRentalHours,
    defaultRentalHours,
    categorySearch,
    createTool,
    canAddTool,
    isSaving,
    photos,
    addPhotos,
    removePhoto,
  } = addTool;

  return (
    <div>
      <h2 className="px-2 text-lg">New Tool</h2>
      <div className="mb-3 mt-1 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
        <TextInput
          label="Short Description"
          value={shortDescription}
          onChange={setShortDescription}
          placeholder="A red screw driver, square head"
        />
        <PureCategorySearch {...categorySearch} />
        <div className="md:col-span-2">
          <FileSelect id="tool-photos" label="Photos" onChange={addPhotos} />
          <ul>
            {photos.map((photo) => (
              <li key={photo.id}>
                <div
                  className="my-2 flex cursor-pointer items-center"
                  onClick={() => removePhoto(photo.id)}
                >
                  <img src={photo.url} alt="" className="h-12" />
                  <span className="ml-2">{photo.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <LargeTextInput
            id="tool-long-description"
            label="Long Description"
            value={longDescription}
            onChange={setLongDescription}
            placeholder=""
          />
        </div>
        <TextInput
          label="Real ID"
          value={realId}
          onChange={setRealId}
          placeholder="X5J2"
        />
        <TextInput
          label="Rental Hours"
          value={rentalHours}
          onChange={setRentalHours}
          placeholder={`${defaultRentalHours}`}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2 px-2">
        <Button
          onClick={createTool}
          text="Add Tool"
          disabled={!canAddTool}
          isLoading={isSaving}
        />
        <Button
          onClick={createTool}
          text="+ Add Tool"
          disabled={!canAddTool}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
};

export const AddTool = (params) => {
  const addTool = useAddTool(params);
  return <PureAddTool {...addTool} />;
};

export const Store = () => {
  const store = useStore();
  return <PureStore {...store} />;
};
