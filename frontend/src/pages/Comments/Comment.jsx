import { useState, memo } from "react";
import { format } from "date-fns";
import { Reply } from "./Reply";

export const useComment = ({ isActive, darkBg, data, dispatch }) => {
  const [renderReplies, setRenderReplies] = useState(false);

  if (isActive && !renderReplies) {
    setRenderReplies(true);
  }

  const onClick = () => {
    dispatch?.({ type: "setActiveComment", payload: { uuid: data?.uuid } });
  };

  const onSeeEdits = (e) => {
    if (isActive) {
      e?.stopPropagation?.();
    }

    console.log("see edits for comment " + data?.uuid);
  };

  const onRemove = (e) => {
    e?.stopPropagation?.();
    dispatch?.({ type: "removeComment", payload: { uuid: data?.uuid } });
  };

  const onDeleted = (e) => {
    dispatch?.({ type: "undeleteComment", payload: { uuid: data?.uuid } });
  };

  const onFlag = (e) => {
    if (isActive) {
      e?.stopPropagation?.();
    }

    console.log("flag comment " + data?.uuid);
  };

  const onEdit = (e) => {
    e?.stopPropagation?.();
    dispatch?.({
      type: "editComment",
      payload: { uuid: data?.uuid, text: data?.text },
    });
  };

  const viewCommenter = (e) => {
    if (isActive) {
      e?.stopPropagation?.();
    }

    console.log("view commenter " + data?.commenter?.id);
  };

  return {
    data,
    canEdit: data?.canEdit,
    darkBg,
    isActive,
    renderReplies: isActive || renderReplies,
    dispatch,
    onClick,
    onSeeEdits,
    onRemove,
    onDeleted,
    onFlag,
    onEdit,
    viewCommenter,
  };
};

const PureComment = (comment) => {
  if (comment?.data?.deleted) {
    return (
      <div
        className={
          "flex justify-between py-1 pl-1 text-sm italic" +
          (comment?.darkBg
            ? " border-l-4 border-neutral-100 bg-neutral-100"
            : " border-l-4 border-white")
        }
      >
        <p>
          deleted,{" "}
          {comment?.data?.time
            ? format(comment?.data?.time, "HH:mm dd/MM")
            : ""}
        </p>
        {comment?.canEdit && (
          <p
            onClick={(e) => comment?.onDeleted?.(e)}
            className="cursor-pointer px-2 text-sm"
          >
            +
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => comment?.onClick?.(e)}
      className={
        "py-1 " +
        (comment?.darkBg
          ? "border-l-4 border-neutral-100 bg-neutral-100"
          : "border-l-4 border-white")
      }
    >
      <div className="py-1 pl-1">
        <div className="mb-0.5 flex flex-row justify-between pr-2">
          <p>{comment?.data?.text}</p>
          <p className="ml-2">{comment?.data?.replies?.length}</p>
        </div>
        <div className="flex flex-row justify-between text-sm">
          <p className="italic">
            <span
              className="cursor-pointer"
              onClick={(e) => comment?.viewCommenter?.(e)}
            >
              {comment?.data?.commenter?.name},{" "}
            </span>
            <span>
              {comment?.data?.time
                ? format(comment?.data?.time, "HH:mm dd/MM")
                : ""}
            </span>
            {comment?.data?.edits?.length ? (
              <span
                className="cursor-pointer"
                onClick={(e) => comment?.onSeeEdits?.(e)}
              >
                , edited
              </span>
            ) : (
              ""
            )}
          </p>
          <div className="flex flex-row">
            {comment?.canEdit && (
              <p
                className="cursor-pointer px-1"
                onClick={(e) => comment?.onEdit?.(e)}
              >
                edit
              </p>
            )}
            <p
              className="cursor-pointer px-1"
              onClick={(e) => comment?.onFlag?.(e)}
            >
              flag
            </p>
            {comment?.canEdit && (
              <p
                className="cursor-pointer pl-1 pr-2"
                onClick={(e) => comment?.onRemove?.(e)}
              >
                &ndash;
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className={
          "transition-max-height duration-300 ease-out " +
          (comment?.isActive
            ? "max-h-96 overflow-y-scroll"
            : "max-h-0 overflow-y-hidden")
        }
      >
        {comment?.renderReplies &&
          comment?.data?.replies?.map((data) => (
            <Reply
              key={data?.uuid}
              commentUuid={comment?.data?.uuid}
              data={data}
              dispatch={comment?.dispatch}
            />
          ))}
      </div>
    </div>
  );
};

export const Comment = memo((props) => {
  const comment = useComment(props);
  return <PureComment {...comment} />;
});
