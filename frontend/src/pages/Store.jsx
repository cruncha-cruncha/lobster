import { useState, useEffect, useReducer } from "react";
import { useParams, useNavigate, Link } from "react-router";
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
import { PureSingleUserSelect, useSingleUserSelect } from "./Stores";

export const URL_STORE_ID_KEY = "storeId";

export const useStore = () => {
  const params = useParams();
  const { toolCart } = useToolCart();
  const { userId, accessToken, permissions } = useAuth();
  const { storeStatuses, roles } = useConstants();
  const storeId = params.id;

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get store ${storeId}, using ${accessToken}`,
    () => endpoints.getStore({ id: storeId, accessToken }),
  );

  const goToStores = () => "/stores";

  const goToPeople = () => `/people?${URL_STORE_ID_KEY}=${storeId}`;

  const goToTools = () => `/tools?${URL_STORE_ID_KEY}=${storeId}`;

  const cartSize = toolCart.filter((tool) => tool.storeId == storeId).length;

  const goToCart = () => `/stores/${storeId}/cart`;

  const goToRentals = () => `/rentals?${URL_STORE_ID_KEY}=${storeId}`;

  const showEditStore = permissions.isStoreManager(storeId);
  const showEditStoreStatus = permissions.isStoreAdmin();
  const showAddTool = permissions.isToolManager(storeId) && data?.status == 1;

  return {
    userId,
    data: {
      ...data,
      status: storeStatuses.find((s) => s.id == data?.status),
    },
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
          goTo={goToStores()}
          text="All Stores"
          variant="blue"
          size="sm"
        />
        <Button goTo={goToTools()} text="Tools" variant="blue" size="sm" />
        <Button goTo={goToRentals()} text="Rentals" variant="blue" size="sm" />
        <Button goTo={goToPeople()} text="People" variant="blue" size="sm" />
        <Button
          goTo={goToCart()}
          text={`Cart (${cartSize})`}
          variant="blue"
          size="sm"
        />
      </div>
      <div className={"mb-3 px-2"}>
        <p>status: {data?.status?.name}</p>
        <p>name: {data?.name?.trim()}</p>
        <p>code: {data?.code?.trim()}</p>
        <p>location: {data?.location?.trim()}</p>
        <p>phone: {data?.phoneNumber?.trim()}</p>
        <p>email: {data?.emailAddress?.trim()}</p>
        <p>rental info: {data?.rentalInformation?.trim()}</p>
        <p>other info: {data?.otherInformation?.trim()}</p>
      </div>
      <StoreUsers storeId={storeId} />
      <div className="pt-2"></div>
      {showAddTool && <AddTool storeId={storeId} />}
      {showEditStore && <EditStore storeId={storeId} />}
      {showEditStoreStatus && <EditStoreStatus storeId={storeId} />}
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
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [realId, _setRealId] = useState("");
  const [shortDescription, _setShortDescription] = useState("");
  const [longDescription, _setDescription] = useState("");
  const {
    addPhoto,
    removePhoto,
    photos,
    clear: clearPhotos,
    getLatest: getLatestPhotos,
  } = useImageUpload();
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
    let latestPhotos = getLatestPhotos();
    while (latestPhotos.filter((photo) => !photo.key).length > 0) {
      count += 1;
      if (count > lim) {
        throw new Error("Timeout waiting for photos to upload");
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      latestPhotos = getLatestPhotos();
    }

    return endpoints
      .createTool({
        info: {
          realId: realId.trim(),
          storeId: Number(storeId),
          categoryIds: [],
          shortDescription,
          longDescription,
          rentalHours: parseInt(rentalHours, 10) || defaultRentalHours,
          photoKeys: latestPhotos.map((photo) => photo.key),
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
                  className="my-2 flex cursor-pointer items-center gap-2"
                  onClick={() => removePhoto(photo.id)}
                >
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <img
                      src={photo.url}
                      alt=""
                      className="max-h-full max-w-full"
                    />
                  </div>
                  <span>{photo.name}</span>
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

export const useStoreUsers = ({ storeId }) => {
  const { accessToken, userId, permissions } = useAuth();
  const _singleUserSelect = useSingleUserSelect();
  const { roles } = useConstants();
  const [selectedRole, _setSelectedRole] = useState("0");
  const [showFields, setShowFields] = useState(""); // "", "add", "remove"
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [isRemovingPermissions, setIsRemovingPermissions] = useState(false);
  const [toDelete, _setToDelete] = useState([]);

  const endpointParams = {
    storeIds: [parseInt(storeId, 10)],
  };

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken
      ? null
      : `get users, using ${accessToken} and ${endpointParams}`,
    () => endpoints.searchUsers({ accessToken, params: endpointParams }),
  );

  const singleUserSelect = {
    ..._singleUserSelect,
  };

  const setSelectedRole = (e) => {
    _setSelectedRole(e.target.value);
  };

  const goToPerson = (id) => `/people/${id}`;

  const toggleMarkPermissioForDelete = (permissionId) => {
    _setToDelete((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id != permissionId);
      }
      return [...prev, permissionId];
    });
  };

  const removePermissions = async () => {
    setIsRemovingPermissions(true);

    await Promise.all(
      toDelete.map((id) =>
        endpoints.removeUserPermission({ id, accessToken }).then(() => {
          mutate((prev) => {
            const user = prev.users.find((u) =>
              u.permissions.find((p) => p.id == id),
            );
            user.permissions = user.permissions.filter((p) => p.id != id);
            return { ...prev };
          });
        }),
      ),
    )
      .then(() => {
        setShowFields("");
        _setToDelete([]);
      })
      .catch((e) => {
        // do something
      })
      .finally(() => {
        setIsRemovingPermissions(false);
      });
  };

  const addPermission = async () => {
    setIsAddingPermission(true);

    const permission = {
      userId: Number(_singleUserSelect.userId),
      roleId: Number(selectedRole),
      storeId: Number(storeId),
    };

    const user = { ..._singleUserSelect.user };

    endpoints
      .addUserPermission({
        permission,
        accessToken,
      })
      .then((data) => {
        _setSelectedRole("0");
        _singleUserSelect.clear();
        setShowFields("");
        mutate((prev) => {
          const existingUser =
            prev.users.find((u) => u.id == data.userId) || user || {};

          const out = {
            ...prev,
            users: [
              ...prev.users.filter((u) => u.id != data.userId),
              {
                ...existingUser,
                permissions: [...(existingUser.permissions || []), data],
              },
            ],
          };

          return out;
        });
      })
      .finally(() => {
        setIsAddingPermission(false);
      });
  };

  const canAddPermission = (() => {
    if (showFields !== "add") return false;
    if (selectedRole == "0") return false;
    if (!_singleUserSelect.userId) return false;
    return true;
  })();

  return {
    userId,
    users: (data?.users || []).map((user) => ({
      ...user,
      permissions: user.permissions
        .filter((p) => p.storeId == storeId)
        .map((p) => ({
          ...p,
          role: roles.find((r) => r.id == p.roleId),
        })),
    })),
    singleUserSelect,
    roleOptions: [
      { name: "Select Role", id: "0" },
      ...roles.filter(
        (r) => r.name == "store_manager" || r.name == "tool_manager",
      ),
    ],
    selectedRole,
    setSelectedRole,
    goToPerson,
    showEditRoles: permissions.isStoreManager(storeId),
    showFields,
    showAddFields: () => setShowFields("add"),
    showRemoveFields: () => setShowFields("remove"),
    toggleShowFields: () => {
      setShowFields("");
      _setToDelete([]);
    },
    isAddingPermission,
    isRemovingPermissions,
    canRemovePermissions: toDelete.length > 0,
    toggleMarkPermissioForDelete,
    toDelete,
    removePermissions,
    canAddPermission,
    addPermission,
  };
};

export const PureStoreUsers = (storeUsers) => {
  const {
    userId,
    singleUserSelect,
    roleOptions,
    selectedRole,
    setSelectedRole,
    users,
    goToPerson,
    showEditRoles,
    showFields,
    showAddFields,
    showRemoveFields,
    toggleShowFields,
    isAddingPermission,
    isRemovingPermissions,
    canRemovePermissions,
    toggleMarkPermissioForDelete,
    toDelete,
    removePermissions,
    canAddPermission,
    addPermission,
  } = storeUsers;

  return (
    <div className="">
      <div className="">
        <h2 className="px-2 text-lg">People</h2>
        <ul className="mt-1 overflow-y-auto border-x-2 border-stone-400 px-2 py-px [&>*]:my-1">
          {users.length <= 0 && (
            <li>
              <span className="text-stone-400">none</span>
            </li>
          )}
          {users.map((user) =>
            user.permissions.map((p) => (
              <li
                key={`${user.id}-${p.id}`}
                className={
                  "my-1" +
                  (showFields == "remove" ? " cursor-pointer" : "") +
                  (toDelete.includes(p.id) ? " text-stone-400" : "")
                }
                onClick={() => {
                  showFields == "remove" && toggleMarkPermissioForDelete(p.id);
                }}
              >
                {showFields == "remove" && !toDelete.includes(p.id) && (
                  <span className="text-red-400">X </span>
                )}
                <span>
                  {userId == user.id ? (
                    <>
                      {showFields == "remove" ? (
                        "You"
                      ) : (
                        <Link to={goToPerson(user.id)}>You</Link>
                      )}
                      <span> are a </span>
                    </>
                  ) : (
                    <>
                      {showFields == "remove" ? (
                        <>
                          {user.username.trim()}
                          {!user.emailAddress?.trim()
                            ? ""
                            : ` (${user.emailAddress.trim()})`}
                        </>
                      ) : (
                        <Link to={goToPerson(user.id)}>
                          {user.username.trim()}
                          {!user.emailAddress?.trim()
                            ? ""
                            : ` (${user.emailAddress.trim()})`}
                        </Link>
                      )}
                      <span> is a </span>
                    </>
                  )}
                  {p.role.name}
                </span>
              </li>
            )),
          )}
        </ul>
      </div>
      {showEditRoles && (
        <div className="px-2">
          {showFields == "" && (
            <div className="mt-3 flex justify-start gap-2">
              <Button
                text="Add Permission"
                onClick={showAddFields}
                variant="blue"
              />
              <Button
                text="Remove Permissions"
                onClick={showRemoveFields}
                variant="blue"
              />
            </div>
          )}
          {showFields == "add" && (
            <div>
              <div className="mb-3 mt-1 grid grid-cols-1 gap-x-4 gap-y-2">
                <PureSingleUserSelect {...singleUserSelect} />
                <Select
                  id={`person-role`}
                  label="Role"
                  options={roleOptions}
                  value={selectedRole}
                  onChange={setSelectedRole}
                />
              </div>
              <div className="mt-3 flex justify-between gap-2">
                <Button
                  text="Cancel"
                  onClick={toggleShowFields}
                  variant="blue"
                />
                <Button
                  text="Add Permission"
                  disabled={!canAddPermission}
                  onClick={addPermission}
                  isLoading={isAddingPermission}
                />
              </div>
            </div>
          )}
          {showFields == "remove" && (
            <div>
              <div className="mt-3 flex justify-between gap-2">
                <Button
                  text="Cancel"
                  onClick={toggleShowFields}
                  variant="blue"
                />
                <Button
                  text="Save Changes"
                  disabled={!canRemovePermissions}
                  onClick={removePermissions}
                  isLoading={isRemovingPermissions}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const StoreUsers = (params) => {
  const storeUsers = useStoreUsers(params);
  return <PureStoreUsers {...storeUsers} />;
};

export const Store = () => {
  const store = useStore();
  return <PureStore {...store} />;
};
