import { useReducer, useState } from "react";
import { useNavigate } from "react-router";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useAuth } from "../state/auth";
import { LargeTextInput } from "../components/LargeTextInput";

const infoReducer = (state, action) => {
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

export const useNewStore = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [info, dispatch] = useReducer(infoReducer, {
    name: "",
    location: "",
    emailAddress: "",
    phoneNumber: "",
    rentalInformation: "",
    otherInformation: "",
  });

  const handleCreateStore = async () => {
    setIsCreating(true);
    endpoints
      .createStore({
        info,
        accessToken,
      })
      .then((data) => {
        navigate(`/stores/${data.id}`);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const handleCancel = () => {
    navigate("/stores");
  };

  const setName = (e) => dispatch({ type: "name", value: e.target.value });
  const setLocation = (e) =>
    dispatch({ type: "location", value: e.target.value });
  const setEmailAddress = (e) =>
    dispatch({ type: "emailAddress", value: e.target.value });
  const setPhoneNumber = (e) =>
    dispatch({ type: "phoneNumber", value: e.target.value });
  const setRentalInformation = (e) =>
    dispatch({ type: "rentalInformation", value: e.target.value });
  const setOtherInformation = (e) =>
    dispatch({ type: "otherInformation", value: e.target.value });

  return {
    info,
    setName,
    setLocation,
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canCreateNewStore: info.name && info.location && info.phoneNumber,
    handleCreateStore,
    handleCancel,
    isCreating,
  };
};

export const PureNewStore = (newStore) => {
  const {
    info,
    setName,
    setLocation,
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canCreateNewStore,
    handleCreateStore,
    handleCancel,
    isCreating,
  } = newStore;

  return (
    <div>
      <h1 className="my-2 px-2 text-xl">New Store</h1>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2 md:grid-cols-2">
        <TextInput
          id={`new-store-name`}
          label="Name"
          value={info.name}
          onChange={setName}
          placeholder="Maple Key Tools"
        />
        <TextInput
          id={`new-store-location`}
          label="Location"
          value={info.location}
          onChange={setLocation}
          placeholder="123 Main St, Ottawa, ON, K1R 7T7"
        />
        <TextInput
          id={`new-store-email-address`}
          label="Email Address"
          value={info.emailAddress}
          onChange={setEmailAddress}
          placeholder="store-contact@example.com"
        />
        <TextInput
          id={`new-store-phone-number`}
          label="Phone Number"
          value={info.phoneNumber}
          onChange={setPhoneNumber}
          placeholder="216-245-2368"
        />
        <div className="md:col-span-2">
          <LargeTextInput
            id="new-store-tool-rental-information"
            label="Read Before Renting"
            value={info.rentalInformation}
            onChange={setRentalInformation}
            placeholder="By appointment only ..."
          />
        </div>
        <div className="md:col-span-2">
          <TextInput
            id="new-store-other-information"
            label="Other Information"
            value={info.otherInformation}
            onChange={setOtherInformation}
            placeholder=""
          />
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-2 px-2">
        <Button onClick={handleCancel} variant="blue" text="Cancel" />
        <Button
          onClick={handleCreateStore}
          text="Create New Store"
          disabled={!canCreateNewStore}
          isLoading={isCreating}
        />
      </div>
    </div>
  );
};

export const NewStore = () => {
  const newStore = useNewStore();
  return <PureNewStore {...newStore} />;
};
