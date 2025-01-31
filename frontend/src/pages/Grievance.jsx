import { useState, useEffect } from "react";
import { useParams } from "react-router";
import useSWR, { useSWRConfig } from "swr";
import { useConstants } from "../state/constants";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";

export const useGrievance = () => {
  const params = useParams();
  const { accessToken, userId, permissions } = useAuth();
  const { grievanceStatuses } = useConstants();
  const grievanceId = params.id;

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get grievance ${grievanceId}, using ${accessToken}`,
    () => endpoints.getGrievance({ id: grievanceId, accessToken }),
  );

  const {
    data: repliesData,
    error: repliesError,
    isLoading: repliesIsLoading,
    mutate: repliesMutate,
  } = useSWR(
    !accessToken
      ? null
      : `get replies for grievance ${grievanceId}, using ${accessToken} and ${JSON.stringify(
          {
            orderAsc: true,
          },
        )}`,
    () =>
      endpoints.getGrievanceReplies({
        grievanceId,
        params: { orderAsc: true },
        accessToken,
      }),
  );

  const goToGrievances = () => "/grievances";

  const goToAuthor = () => `/people/${data?.author.id}`;

  const goToAccused = () => `/people/${data?.accused.id}`;

  const status = !data?.status
    ? ""
    : grievanceStatuses.find((s) => s.id == data.status)?.name;

  const showMakeReply =
    permissions.isUserAdmin() ||
    data?.author.id == userId ||
    data?.accused.id == userId;

  const showUpdateStatus = permissions.isUserAdmin();

  return {
    grievanceId,
    title: data?.title || "Title",
    description: data?.description || "Description",
    author: data?.author || { id: 0, username: "" },
    accused: data?.accused || { id: 0, username: "" },
    status,
    replies: repliesData?.grievanceReplies || [],
    showMakeReply,
    showUpdateStatus,
    goToGrievances,
    goToAuthor,
    goToAccused,
  };
};

export const PureGrievance = (grievance) => {
  const {
    grievanceId,
    title,
    description,
    author,
    accused,
    status,
    replies,
    showMakeReply,
    showUpdateStatus,
    goToGrievances,
    goToAuthor,
    goToAccused,
  } = grievance;

  return (
    <div>
      <h1 className="mt-2 px-2 text-xl">{title}</h1>
      <div className="my-2 flex flex-wrap justify-start gap-2 px-2">
        <Button
          goTo={goToGrievances()}
          text="All Grievances"
          variant="blue"
          size="sm"
        />
        <Button goTo={goToAuthor()} text="Author" variant="blue" size="sm" />
        <Button goTo={goToAccused()} text="Accused" variant="blue" size="sm" />
      </div>
      <div className="mb-2 px-2">
        <p>Accused: {accused.username}</p>
        <p>Status: {status}</p>
      </div>
      {showUpdateStatus && <UpdateGrievanceStatus grievanceId={grievanceId} />}
      <ul className="mb-3 mt-2 px-2">
        <li className="pl-2 -indent-2">
          {author.username}: {description}
        </li>
        {replies.map((reply) => (
          <li key={reply.id}>
            <p className="pl-2 -indent-2">
              {reply.author.username}: {reply.text}
            </p>
          </li>
        ))}
      </ul>
      {showMakeReply && <MakeGrievanceReply grievanceId={grievanceId} />}
    </div>
  );
};

export const useMakeGrievanceReply = ({ grievanceId }) => {
  const { accessToken } = useAuth();
  const { mutate } = useSWRConfig();
  const [reply, _setReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const replyToGrievance = () => {
    setIsLoading(true);
    endpoints
      .createGrievanceReply({
        grievanceId,
        info: { text: reply },
        accessToken,
      })
      .then((data) => {
        mutate(
          `get replies for grievance ${grievanceId}, using ${accessToken} and ${JSON.stringify(
            {
              orderAsc: true,
            },
          )}`,
          (prev) => ({
            ...prev,
            grievanceReplies: [...prev.grievanceReplies, data],
          }),
        );
        _setReply("");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const setReply = (e) => {
    _setReply(e.target.value);
  };

  const canReply = reply.length > 0;

  return {
    replyToGrievance,
    canReply,
    reply,
    setReply,
    isLoading,
  };
};

export const PureMakeGrievanceReply = (makeGrievanceReply) => {
  const { replyToGrievance, canReply, reply, setReply, isLoading } =
    makeGrievanceReply;

  return (
    <div className="px-2">
      <TextInput
        id={`reply-text`}
        label="Reply"
        value={reply}
        onChange={setReply}
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          text="Reply"
          onClick={replyToGrievance}
          variant="green"
          disabled={!canReply}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export const MakeGrievanceReply = (params) => {
  const makeGrievanceReply = useMakeGrievanceReply(params);
  return <PureMakeGrievanceReply {...makeGrievanceReply} />;
};

export const useUpdateGrievanceStatus = ({ grievanceId }) => {
  const { accessToken } = useAuth();
  const { grievanceStatuses } = useConstants();
  const [status, _setStatus] = useState("0");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    !accessToken ? null : `get grievance ${grievanceId}, using ${accessToken}`,
    () => endpoints.getGrievance({ id: grievanceId, accessToken }),
  );

  useEffect(() => {
    if (data && status == "0") {
      _setStatus(data.status);
    }
  }, [data, status]);

  const updateStatus = () => {
    setIsUpdating(true);
    endpoints
      .updateGrievanceStatus({
        id: grievanceId,
        status: Number(status),
        accessToken,
      })
      .then((data) => {
        mutate((prev) => ({ ...prev, status: data.status }));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const setStatus = (e) => {
    _setStatus(e.target.value);
  };

  const canUpdateStatus = data?.status != status;

  return {
    updateStatus,
    status,
    setStatus,
    canUpdateStatus,
    options: grievanceStatuses,
    isUpdating,
  };
};

export const PureUpdateGrievanceStatus = (updateGrievanceStatus) => {
  const {
    updateStatus,
    status,
    setStatus,
    canUpdateStatus,
    options,
    isUpdating,
  } = updateGrievanceStatus;

  return (
    <div className="px-2">
      <Select
        id={`grievance-status`}
        label="Status"
        value={status}
        onChange={setStatus}
        options={options}
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          text="Update"
          onClick={updateStatus}
          variant="green"
          disabled={!canUpdateStatus}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
};

export const UpdateGrievanceStatus = (params) => {
  const updateGrievanceStatus = useUpdateGrievanceStatus(params);
  return <PureUpdateGrievanceStatus {...updateGrievanceStatus} />;
};

export const Grievance = () => {
  const grievance = useGrievance();
  return <PureGrievance {...grievance} />;
};
