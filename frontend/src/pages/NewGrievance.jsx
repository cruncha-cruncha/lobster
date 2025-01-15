import { useReducer, useState } from "react";
import { useNavigate } from "react-router";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { useAuth } from "../state/auth";
import { PureUserSelect, useUserSelect } from "./Rentals";

export const useNewGrievance = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const _selectAccused = useUserSelect();

  const [title, _setTitle] = useState("");
  const [description, _setDescription] = useState("");

  const handleCreateGrievance = async () => {
    const info = {
        title,
        description,
        accusedId: _selectAccused.users[0].id,
    }

    endpoints
      .createGrievance({
        info,
        accessToken,
      })
      .then(() => {
        console.log("Grievance created");
        // do something
      });
  };

  const handleCancel = () => {
    navigate("/grievances");
  };

  const setTitle = (e) => _setTitle(e.target.value);

  const setDescription = (e) => _setDescription(e.target.value);

  const canCreateNewGrievance = title.length > 0 && description.length > 0;

  const selectAccused = {
    ..._selectAccused,
    addUser: async (userId) => {
      _selectAccused.clear();
      _selectAccused.addUser(userId);
    },
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    handleCancel,
    handleCreateGrievance,
    canCreateNewGrievance,
    selectAccused,
  };
};

export const PureNewGrievance = (newStore) => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    handleCancel,
    handleCreateGrievance,
    canCreateNewGrievance,
    selectAccused,
  } = newStore;

  return (
    <div>
      <h1 className="my-2 px-2 text-xl">Fresh Grievance</h1>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        {/* user select */}
        <PureUserSelect {...selectAccused} label="Accused" />
        <TextInput
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="Picked My Nose"
        />
        <TextInput
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder=""
        />
      </div>
      <div className="mt-3 flex justify-between gap-2 px-2">
        <Button onClick={handleCancel} variant="blue" text="Cancel" />
        <Button
          onClick={handleCreateGrievance}
          text="Open New Grievance"
          disabled={!canCreateNewGrievance}
        />
      </div>
    </div>
  );
};

export const NewGrievance = () => {
  const newGrievance = useNewGrievance();
  return <PureNewGrievance {...newGrievance} />;
};
