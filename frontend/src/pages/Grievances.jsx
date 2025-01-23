import { useState, useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Link, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import { Select } from "../components/Select";
import { usePrevNext, PurePrevNext } from "../components/PrevNext";
import { Button } from "../components/Button";
import { PureUserSelect, useUserSelect } from "./Rentals";

export const URL_AUTHOR_ID_KEY = "authorId";
export const URL_ACCUSED_ID_KEY = "accusedId";

export const useGrievances = () => {
  const { accessToken } = useAuth();
  const [urlParams, setUrlParams] = useSearchParams();
  const { grievanceStatuses: _grievanceStatuses } = useConstants();
  const [status, _setStatus] = useState("0");
  const [statuses, _setStatuses] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const pageControl = usePrevNext();
  const _authorSelect = useUserSelect();
  const _accusedSelect = useUserSelect();
  const urlAuthorId = urlParams.get(URL_AUTHOR_ID_KEY);
  const urlAccusedId = urlParams.get(URL_ACCUSED_ID_KEY);

  const authorSelect = {
    ..._authorSelect,
    addUser: (userId) => {
      if (urlAuthorId) {
        urlParams.delete(URL_AUTHOR_ID_KEY);
        setUrlParams(urlParams);
      }
      _authorSelect.addUser(userId);
      pageControl.setPage(1);
    },
    removeUser: (userId) => {
      if (urlAuthorId) {
        urlParams.delete(URL_AUTHOR_ID_KEY);
        setUrlParams(urlParams);
      }
      _authorSelect.removeUser(userId);
      pageControl.setPage(1);
    },
  };

  const accusedSelect = {
    ..._accusedSelect,
    addUser: (userId) => {
      if (urlAccusedId) {
        urlParams.delete(URL_ACCUSED_ID_KEY);
        setUrlParams(urlParams);
      }
      _accusedSelect.addUser(userId);
      pageControl.setPage(1);
    },
    removeUser: (userId) => {
      if (urlAccusedId) {
        urlParams.delete(URL_ACCUSED_ID_KEY);
        setUrlParams(urlParams);
      }
      _accusedSelect.removeUser(userId);
      pageControl.setPage(1);
    },
  };

  // filter by author if urlAuthorId is present
  {
    useEffect(() => {
      if (!urlAuthorId || !accessToken) return;
      _authorSelect.addUser(urlAuthorId);
    }, [urlAuthorId, accessToken]);

    const { data } = useSWR(
      !urlAuthorId || !accessToken
        ? null
        : `get user ${urlAuthorId}, using ${accessToken}`,
      () => endpoints.getUser({ id: urlAuthorId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        _authorSelect.setUserTerm({ target: { value: data.username } });
      }
    }, [data]);
  }

  // filter by accused if urlAccusedId is present
  {
    useEffect(() => {
      if (!urlAccusedId || !accessToken) return;
      _accusedSelect.addUser(urlAccusedId);
    }, [urlAccusedId, accessToken]);

    const { data } = useSWR(
      !urlAccusedId || !accessToken
        ? null
        : `get user ${urlAccusedId}, using ${accessToken}`,
      () => endpoints.getUser({ id: urlAccusedId, accessToken }),
    );

    useEffect(() => {
      if (data) {
        _accusedSelect.setUserTerm({ target: { value: data.username } });
      }
    }, [data]);
  }

  const setStatus = (e) => {
    const statusId = e.target.value;
    _setStatus(statusId);
    pageControl.setPage(1);

    if (statusId == "0") {
      _setStatuses([]);
      return;
    }

    const newStatus = grievanceStatuses.find((s) => s.id == statusId);
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
    authorIds: !urlAuthorId
      ? authorSelect.users.map((u) => u.id)
      : [urlAuthorId],
    accusedIds: !urlAccusedId
      ? accusedSelect.users.map((u) => u.id)
      : [urlAccusedId],
    statuses: statuses.map((s) => s.id),
    page: pageControl.pageNumber,
  };

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken
      ? null
      : `get grievances, using ${accessToken} and ${JSON.stringify(
          endpointParams,
        )}`,
    () => endpoints.searchGrievances({ params: endpointParams, accessToken }),
  );

  const goToNewGrievance = () => "/grievances/new";

  const goToGrievance = (grievanceId) => `/grievances/${grievanceId}`;

  useEffect(() => {
    if (data) {
      setGrievances(data.grievances);
    }
  }, [data]);

  const grievanceStatuses = [{ id: "0", name: "All" }, ..._grievanceStatuses];

  return {
    setStatus,
    statuses,
    removeStatus,
    authorSelect,
    accusedSelect,
    status,
    grievanceStatuses,
    pageControl,
    goToNewGrievance,
    goToGrievance,
    grievanceList: grievances,
  };
};

export const PureGrievances = (grievances) => {
  const {
    setStatus,
    statuses,
    removeStatus,
    authorSelect,
    accusedSelect,
    status,
    grievanceStatuses,
    pageControl,
    goToNewGrievance,
    goToGrievance,
    grievanceList,
  } = grievances;

  return (
    <div>
      <div className="my-2 flex items-center gap-2 px-2">
        <h1 className="mr-2 text-xl">Grievances</h1>
        <Button
          text="Open New"
          goTo={goToNewGrievance()}
          variant="blue"
          size="sm"
        />
      </div>
      <div className="px-2">
        <p>
          A grievance can be opened for any number of reasons: a tool returned
          broken, a rude interaction, a missing piece. Here you can also search
          for past grievances by author, accused, or title. Click on one of the
          results to see more information about the grievance (including
          replies). Results are displayed as 'author: Title (accused)'. Only
          user administrators can update the status of a grievance.
        </p>
      </div>
      <div className="mb-3 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 px-2">
        <PureUserSelect {...authorSelect} label="Authors" />
        <PureUserSelect {...accusedSelect} label="Accused" />
        <div>
          <Select
            id={`grievance-status`}
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
      <ul className="mb-3 mt-4 overflow-y-auto border-x-2 border-stone-400 px-2 [&>*:first-child]:mt-1 [&>*:last-child]:mb-1 [&>*]:my-2">
        {grievanceList.length == 0 && (
          <li className="text-stone-400">no results</li>
        )}
        {grievanceList.map((grievance) => (
          <li key={grievance.id}>
            <Link to={goToGrievance(grievance.id)} className="cursor-pointer">
              <p>
                {grievance.author.username.trim()}: {grievance.title.trim()} (
                {grievance.accused.username.trim()})
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <PurePrevNext {...pageControl} />
    </div>
  );
};

export const Grievances = (params) => {
  const grievances = useGrievances(params);
  return <PureGrievances {...grievances} />;
};
