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
import { PureUserSelect, useUserSelect } from "./Rentals";

export const Grievances = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { grievanceStatuses: _grievanceStatuses } = useConstants();
  const [status, _setStatus] = useState("0");
  const [statuses, _setStatuses] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [page, setPage] = useState(1);
  const selectAuthor = useUserSelect();
  const selectAccused = useUserSelect();

  const setStatus = (e) => {
    const statusId = e.target.value;
    _setStatus(statusId);

    if (statusId == "0") {
      _setStatuses([]);
      return;
    }

    const newStatus = grievanceStatuses.find((s) => s.id == statusId);
    console.log(newStatus);
    _setStatuses((prev) => {
      const newList = [...prev.filter((s) => s.id != statusId), newStatus];
      return newList.sort((a, b) => a.id - b.id);
    });
  };

  const removeStatus = (statusId) => {
    _setStatuses((prev) => {
      const newList = prev.filter((s) => s.id != statusId);
      if (newList.length == 0) {
        _setStatus("0");
      }
      return newList;
    });
  };

  const endpointParams = {
    authorIds: selectAuthor.users.map((u) => u.id),
    accusedIds: selectAccused.users.map((u) => u.id),
    statuses: statuses.map((s) => s.id),
    page,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get grievances, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchGrievances({ params: endpointParams, accessToken }),
  );

  const goToNewGrievance = () => {
    navigate("/grievances/new");
  };

  useEffect(() => {
    if (data) {
      setGrievances(data.grievances);
    }
  }, [data]);

  const prevPage = () => {
    setPage(prev => {
      if (prev > 1) {
        return prev - 1;
      }
      return prev;
    })
  };

  const nextPage = () => {
    setPage(prev => prev + 1);
  }

  const grievanceStatuses = [{ id: "0", name: "All" }, ..._grievanceStatuses];

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h1 className="mr-2 text-xl">Grievances</h1>
        <Button
          text="Open New"
          onClick={goToNewGrievance}
          variant="blue"
          size="sm"
        />
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <PureUserSelect {...selectAuthor} label="Authors" />
        <PureUserSelect {...selectAccused} label="Accused" />
        <div>
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={grievanceStatuses}
          />
          <ul>
            {statuses.map((status) => (
              <li
                key={status.id}
                onClick={() => removeStatus(status.id)}
                className="cursor-pointer"
              >
                {status.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ul className="mb-3 mt-4 border-x-2 border-stone-400 px-2">
        {grievances.length == 0 && (
          <li className="text-stone-400">no results</li>
        )}
        {grievances.map((grievance) => (
          <li key={grievance.id}>
            <p>{JSON.stringify(grievance)}</p>
          </li>
        ))}
      </ul>
      <PrevNext
        prev={prevPage}
        next={nextPage}
        pageNumber={page}
      />
    </div>
  );
};
