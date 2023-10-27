import { memo } from "react";
import { format } from "date-fns";

export const useReply = ({ commentUuid, data, dispatch }) => {
  const onSeeEdits = (e) => {
    e?.stopPropagation?.();
    console.log("see edits for reply " + data?.uuid);
  };

  const onRemove = (e) => {
    e?.stopPropagation?.();
    dispatch?.({
      type: "removeReply",
      payload: {
        parent: commentUuid,
        uuid: data?.uuid,
      },
    });
  };

  const onDeleted = (e) => {
    e?.stopPropagation?.();
    dispatch?.({
      type: "undeleteReply",
      payload: {
        parent: commentUuid,
        uuid: data?.uuid,
      },
    });
  };

  const onFlag = (e) => {
    e?.stopPropagation?.();
    console.log("flag reply " + data?.uuid);
  };

  const onEdit = (e) => {
    e?.stopPropagation?.();
    dispatch?.({
      type: "editReply",
      payload: {
        parent: commentUuid,
        uuid: data?.uuid,
        text: data?.text
      },
    });
  };

  return {
    data,
    onSeeEdits,
    onRemove,
    onDeleted,
    onFlag,
    onEdit,
  };
};

export const PureReply = (reply) => {
  if (reply?.data?.deleted) {
    return (
      <div
        className={
          "flex rounded-l-lg py-1 pl-2 italic " +
          (!reply?.data?.byCommenter ? "bg-sky-200" : "")
        }
      >
        <p
          className="cursor-pointer text-sm"
          onClick={(e) => reply?.onDeleted?.(e)}
        >
          deleted,{" "}
          {reply?.data?.time ? format(reply?.data?.time, "HH:mm dd/MM") : ""}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-l-lg py-1 pl-2 " +
        (!reply?.data?.byCommenter ? "bg-sky-200" : "")
      }
    >
      <div className="mb-0.5 flex flex-row justify-between pr-2">
        <p>{reply?.data?.text}</p>
      </div>
      <div className="flex flex-row justify-between text-sm">
        <p className="italic">
          <span>
            {reply?.data?.time ? format(reply?.data?.time, "HH:mm dd/MM") : ""}
          </span>
          {reply?.data?.edits?.length ? (
            <span
              className="cursor-pointer"
              onClick={(e) => reply?.onSeeEdits?.(e)}
            >
              , edited
            </span>
          ) : (
            ""
          )}
        </p>
        <div className="flex flex-row">
          <p
            className="cursor-pointer px-1"
            onClick={(e) => reply?.onEdit?.(e)}
          >
            edit
          </p>
          <p
            className="cursor-pointer px-1"
            onClick={(e) => reply?.onFlag?.(e)}
          >
            flag
          </p>
          <p
            className="cursor-pointer pl-1 pr-2"
            onClick={(e) => reply?.onRemove?.(e)}
          >
            &ndash;
          </p>
        </div>
      </div>
    </div>
  );
};

export const Reply = memo((props) => {
  const reply = useReply(props);
  return <PureReply {...reply} />;
});
