import { useReducer } from "react";
import { useNavigate } from "react-router";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useAuth } from "../state/auth";

const infoReducer = (state, action) => {
  switch (action.type) {
    case "name":
      return { ...state, name: action.value };
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

  const [info, dispatch] = useReducer(infoReducer, {
    name: "",
    emailAddress: "",
    phoneNumber: "",
    rentalInformation: "",
    otherInformation: "",
  });

  const handleCreateStore = async () => {
    endpoints.createStore({
      info,
      accessToken,
    }).then((data) => {
      navigate(`/stores/${data.id}`);
    });
  };

  const handleCancel = () => {
    navigate("/stores");
  };

  const setName = (e) => dispatch({ type: "name", value: e.target.value });
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
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canCreateNewStore: info.name && info.emailAddress && info.phoneNumber,
    handleCreateStore,
    handleCancel,
  }
};

export const PureNewStore = (newStore) => {
  const {
    info,
    setName,
    setEmailAddress,
    setPhoneNumber,
    setRentalInformation,
    setOtherInformation,
    canCreateNewStore,
    handleCreateStore,
    handleCancel,
  } = newStore;

  return (
    <div>
      <h1>New Store</h1>
      <TextInput
        label="Name"
        value={info.name}
        onChange={setName}
        placeholder="My Store"
      />
      <TextInput
        label="Email Address"
        value={info.emailAddress}
        onChange={setEmailAddress}
        placeholder="my-email@example.com"
      />
      <TextInput
        label="Phone Number"
        value={info.phoneNumber}
        onChange={setPhoneNumber}
        placeholder="216-245-2368"
      />
      <TextInput
        label="Read Before Renting"
        value={info.rentalInformation}
        onChange={setRentalInformation}
        placeholder="Located at ... by appointment only ..."
      />
      <TextInput
        label="Other Information"
        value={info.otherInformation}
        onChange={setOtherInformation}
        placeholder=""
      />
      <Button onClick={handleCreateStore} text="Create New Store" disabled={!canCreateNewStore} />
      <Button onClick={handleCancel} variant="blue" text="Cancel" />
    </div>
  );
};

export const NewStore = () => {
  const newStore = useNewStore();
  return <PureNewStore {...newStore} />;
}
