import { useState } from "react";
import { useConstants } from "../state/constants";

export const Stores = () => {

  const { storeStatuses } = useConstants();

  const [stores, setStores] = useState([]);
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = useState([]);
  const [name, setName] = useState("");

  // create new store

  return (
    <div>
      <h1>Stores</h1>
    </div>
  );
};
