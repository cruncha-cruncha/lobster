import { useState, useReducer } from "react";
import { useConstants } from "../state/constants";

function reducer(state, action) {
  switch (action.type) {
    case "storeIds":
      return { ...state, storeIds: action.payload };
    case "statuses":
      return { ...state, statuses: action.payload };
    case "roles":
      return { ...state, roles: action.payload };
    case "createdAtStart":
      return {
        ...state,
        createdAt: { ...state.createdAt, start: action.payload },
      };
    case "createdAtEnd":
      return {
        ...state,
        createdAt: { ...state.createdAt, end: action.payload },
      };
    case "reset":
      return {
        storeIds: [],
        statuses: [],
        roles: [],
        createdAt: { start: "", end: "" },
      };
    default:
      return state;
  }
}

export const People = () => {
  // filters
  // search
  // pagination
  // username, email, roles, store, created_at, status
  // link to info (edit)

  const { roles, usersStatuses } = useConstants();

  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, filtersDispatch] = useReducer(reducer, {
    storeIds: [],
    statuses: [],
    roles: [],
    createdAt: { start: "", end: "" },
  });


  const getPeople = async () => {
    // fetch people
    return [];
  };

  return (
    <div>
      <h1>People</h1>
      <div>
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button>Search</button>
      </div>
      <div>
        <p>results</p>
        <ul>
          {people.map((person) => (
            <div>{person.name}</div>
          ))}
        </ul>
      </div>
    </div>
  );
};
