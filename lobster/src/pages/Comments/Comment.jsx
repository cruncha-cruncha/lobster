import { useState, memo } from "react";
import { format } from "date-fns";
import { Reply } from "./Reply";

// TODO: replace 'onClick' with 'dispatch' 
export const useComment = ({ onClick, isActive, darkBg, data }) => {  
  const [renderReplies, setRenderReplies] = useState(false);

  if (isActive && !renderReplies) {
    setRenderReplies(true);
  }

  const onSeeEdits = ({ e, isActive, uuid }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("see edits for comment " + uuid);
  };
  
  const onRemove = ({ e, isActive, uuid }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("remove comment " + uuid);
  };
  
  const onDeleted = ({ e, isActive, uuid }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("undelete comment " + uuid);
  };
  
  const onFlag = ({ e, isActive, uuid }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("flag comment " + uuid);
  };
  
  const onEdit = ({ e, isActive, uuid }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("edit comment " + uuid);
  };
  
  const viewCommenter = ({ e, isActive, commenterId }) => {
    if (isActive) {
      e?.stopPropagation?.();
    }
  
    console.log("view commenter " + commenterId);
  };

  return {
    data,
    onClick,
    darkBg,
    isActive,
    renderReplies: isActive || renderReplies,
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
        onClick={(e) =>
          comment?.onDeleted?.({
            e,
            isActive: comment?.isActive,
            uuid: comment?.data?.uuid,
          })
        }
        className={
          "py-1 pl-1 " +
          (comment?.darkBg
            ? "border-l-4 border-neutral-100 bg-neutral-100"
            : "border-l-4 border-white")
        }
      >
        <div className="flex flex-row justify-between text-sm italic">
          <p>
            deleted,{" "}
            {comment?.data?.time
              ? format(comment?.data?.time, "HH:mm dd/MM")
              : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) =>
        comment?.onClick?.({
          e,
          isActive: comment?.isActive,
          uuid: comment?.data?.uuid,
        })
      }
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
              onClick={(e) =>
                comment?.viewCommenter?.({
                  e,
                  isActive: comment?.isActive,
                  commenterId: comment?.data?.commenter?.id,
                })
              }
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
                onClick={(e) =>
                  comment?.onSeeEdits?.({
                    e,
                    isActive: comment?.isActive,
                    uuid: comment?.data?.uuid,
                  })
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
              onClick={(e) =>
                comment?.onEdit?.({
                  e,
                  isActive: comment?.isActive,
                  uuid: comment?.data?.uuid,
                })
              }
            >
              edit
            </p>
            <p
              className="cursor-pointer px-1"
              onClick={(e) =>
                comment?.onFlag?.({
                  e,
                  isActive: comment?.isActive,
                  uuid: comment?.data?.uuid,
                })
              }
            >
              flag
            </p>
            <p
              className="cursor-pointer pl-1 pr-2"
              onClick={(e) =>
                comment?.onRemove?.({
                  e,
                  isActive: comment?.isActive,
                  uuid: comment?.data?.uuid,
                })
              }
            >
              &ndash;
            </p>
          </div>
        </div>
      </div>
      <div
        className={
          "transition-height duration-300 ease-out " +
          (comment?.isActive
            ? "max-h-96 overflow-y-scroll"
            : "max-h-0 overflow-y-hidden")
        }
      >
        {comment?.renderReplies &&
          comment?.data?.replies?.map((data) => (
            <Reply key={data?.uuid} data={data} />
          ))}
      </div>
    </div>
  );
};

export const Comment = memo((props) => {
  const comment = useComment(props);
  return <PureComment {...comment} />;
});

