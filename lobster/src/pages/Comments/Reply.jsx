import { memo } from "react";
import { format } from "date-fns";

export const useReply = ({ data, dispatch }) => {
  const onSeeEdits = ({ e, uuid }) => {
    e?.stopPropagation?.();
    console.log("see edits for reply " + uuid);
  };
  
  const onRemove = ({ e, uuid }) => {
    e?.stopPropagation?.();
    console.log("remove reply " + uuid);
  };
  
  const onDeleted = ({ e, uuid }) => {
    e?.stopPropagation?.();
    console.log("undelete reply " + uuid);
  };
  
  const onFlag = ({ e, uuid }) => {
    e?.stopPropagation?.();
    console.log("flag reply " + uuid);
  };
  
  const onEdit = ({ e, uuid }) => {
    e?.stopPropagation?.();
    console.log("edit reply " + uuid);
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
        onClick={(e) => reply?.onDeleted?.({ e, uuid: reply?.data?.uuid })}
        className={
          "rounded-l-lg py-1 pl-2 italic " +
          (!reply?.data?.byCommenter ? "bg-sky-200" : "")
        }
      >
        <p className="text-sm">
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
              onClick={(e) =>
                reply?.onSeeEdits?.({ e, uuid: reply?.data?.uuid })
              }
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
            onClick={(e) => reply?.onEdit?.({ e, uuid: reply?.data?.uuid })}
          >
            edit
          </p>
          <p
            className="cursor-pointer px-1"
            onClick={(e) => reply?.onFlag?.({ e, uuid: reply?.data?.uuid })}
          >
            flag
          </p>
          <p
            className="cursor-pointer pl-1 pr-2"
            onClick={(e) => reply?.onRemove?.({ e, uuid: reply?.data?.uuid })}
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
