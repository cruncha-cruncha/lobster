import { useState } from "react";
import { format } from "date-fns";

export const useComments = ({ postData, data }) => {
  const [activeComment, setActiveComment] = useState("");
  const [reply, setReply] = useState("");

  const onReply = () => {
    console.log("reply");
  };

  const handleClickComment = (uuid) => {
    setActiveComment((prev) => {
      if (prev !== uuid) {
        return uuid;
      } else {
        return "";
      }
    });
  };

  const onBack = () => {
    console.log("back");
  };

  return {
    postData,
    data,
    activeComment,
    setActiveComment,
    reply,
    setReply,
    onReply,
    handleClickComment,
    onBack,
  };
};

export const Comments = (comments) => {
  return (
    <div className="flex min-h-full w-full flex-col justify-between pb-2">
      <div className="w-full">
        {comments?.data?.map((data, i) => (
          <Comment
            key={data.uuid}
            {...useComment({
              onClick: () => comments?.handleClickComment(data?.uuid),
              isActive: data?.uuid == comments?.activeComment,
              darkBg: i % 2 == 0,
              data,
            })}
          />
        ))}
      </div>
      <div className="flex px-2">
        <div className="mr-2">
          <p
            className="relative top-2 cursor-pointer pr-2 text-lg font-bold"
            onClick={comments?.onBack}
          >
            {"<"}
          </p>
        </div>
        <form className="flex grow flex-row">
          <input
            className={
              "mr-2 grow rounded p-2 " +
              (comments?.activeComment == "" ? "text-neutral-500" : "")
            }
            type="text"
            placeholder={
              !comments?.activeComment ? "select a comment to reply" : "reply"
            }
            disabled={comments?.activeComment == ""}
            value={comments?.reply}
            onChange={(e) => {
              setReply(e.target.value);
            }}
          />
          <button
            className={
              "rounded-md border-2 px-4 py-2 " +
              (!comments?.activeComment || !comments?.reply
                ? "border-neutral-400 text-neutral-500"
                : "border-white bg-emerald-100 hover:bg-emerald-900 hover:text-white")
            }
            type="button"
            disabled={!comments?.activeComment || !comments?.reply}
            onClick={comments?.onReply}
          >
            Reply
          </button>
        </form>
      </div>
    </div>
  );
};

export const useComment = ({ onClick, isActive, darkBg, data }) => {
  const onSeeEdits = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("see edits for comment " + data.uuid);
  };

  const onRemove = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("remove comment " + data.uuid);
  };

  const onDeleted = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("undelete comment " + data.uuid);
  };

  const onFlag = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("flag comment " + data.uuid);
  };

  const onEdit = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("edit comment " + data.uuid);
  };

  const viewCommenter = (e) => {
    if (isActive) {
      e.stopPropagation();
    }

    console.log("view commenter " + data.commenter.id);
  };

  return {
    data,
    onClick,
    darkBg,
    isActive,
    onSeeEdits,
    onRemove,
    onDeleted,
    onFlag,
    onEdit,
    viewCommenter,
  };
};

export const Comment = (comment) => {
  if (comment?.data?.deleted) {
    return (
      <div
        onClick={comment?.onDeleted}
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
      onClick={comment?.onClick}
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
            <span className="cursor-pointer" onClick={comment?.viewCommenter}>
              {comment?.data?.commenter?.name},{" "}
            </span>
            <span>
              {comment?.data?.time
                ? format(comment?.data?.time, "HH:mm dd/MM")
                : ""}
            </span>
            {comment?.data?.edits?.length ? (
              <span className="cursor-pointer" onClick={comment?.onSeeEdits}>
                , edited
              </span>
            ) : (
              ""
            )}
          </p>
          <div className="flex flex-row">
            <p className="cursor-pointer px-1" onClick={comment?.onEdit}>
              edit
            </p>
            <p className="cursor-pointer px-1" onClick={comment?.onFlag}>
              flag
            </p>
            <p className="cursor-pointer pl-1 pr-2" onClick={comment?.onRemove}>
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
        {comment?.data?.replies?.map((data) => (
          <Reply key={data.uuid} {...useReply({ data })} />
        ))}
      </div>
    </div>
  );
};

export const useReply = ({ data }) => {
  const onSeeEdits = (e) => {
    e.stopPropagation();
    console.log("see edits for reply " + data.uuid);
  };

  const onRemove = (e) => {
    e.stopPropagation();
    console.log("remove reply " + data.uuid);
  };

  const onDeleted = (e) => {
    e.stopPropagation();
    console.log("undelete reply " + data.uuid);
  };

  const onFlag = (e) => {
    e.stopPropagation();
    console.log("flag reply " + data.uuid);
  };

  const onEdit = (e) => {
    e.stopPropagation();
    console.log("edit reply " + data.uuid);
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

export const Reply = (reply) => {
  if (reply?.data?.deleted) {
    return (
      <div
        onClick={reply?.onDeleted}
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
            <span className="cursor-pointer" onClick={reply?.onSeeEdits}>
              , edited
            </span>
          ) : (
            ""
          )}
        </p>
        <div className="flex flex-row">
          <p className="cursor-pointer px-1" onClick={reply?.onEdit}>
            edit
          </p>
          <p className="cursor-pointer px-1" onClick={reply?.onFlag}>
            flag
          </p>
          <p className="cursor-pointer pl-1 pr-2" onClick={reply?.onRemove}>
            &ndash;
          </p>
        </div>
      </div>
    </div>
  );
};

export const fakePostData = {
  uuid: "63856492738",
};

export const fakeData = [
  {
    uuid: "971468364529",
    text: "Hello! First!1! I'm here!",
    time: new Date(), // when it was last edited
    commenter: {
      id: 79283683716,
      name: "Annoying Guy",
    },
    edits: [
      {
        text: "Hello! First!1!",
        time: new Date(),
      },
    ],
    replies: [
      {
        uuid: "9876657654",
        text: "You're really annoying, please stop commenting on my posts, I beg of you. Every morning I wake up in fear that you will once again comment on my post.",
        time: new Date(), // when it was last edited
        edits: [],
        byCommenter: false,
      },
    ],
  },
  {
    uuid: "6729845362098",
    deleted: true,
    time: new Date(),
    commenter: {
      id: 7621039864,
      name: "Mabel",
    },
  },
  {
    uuid: "897687912573",
    text: "Is this still available? I like it but not like like like it, so I'm not willing to put in much effort.",
    time: new Date(),
    commenter: {
      id: 6926539486,
      name: "Marcus",
    },
    edits: [
      {
        time: new Date(),
        deleted: false,
      },
      {
        time: new Date(),
        deleted: true,
      },
      {
        text: "Is this still available?",
        time: new Date(),
      },
    ],
    replies: [
      {
        uuid: "97193476493761",
        text: "Yes it is!",
        time: new Date(),
        byCommenter: false,
        edits: [
          {
            text: "Yes, if the post is still up then it's still available.",
            time: new Date(),
          },
        ],
      },
      {
        uuid: "6789216573928",
        text: "Can I pick it up on the weekend?",
        time: new Date(),
        byCommenter: true,
      },
      {
        uuid: "8243509187635",
        deleted: true,
        time: new Date(),
        byCommenter: false,
      },
    ],
  },
  {
    uuid: "12835629945418",
    text: "Does it still work?",
    time: new Date(),
    commenter: {
      id: 38745541827,
      name: "Rob",
    },
    edits: [],
    replies: [
      {
        uuid: "62789047620464",
        text: "Yes it does!?",
        time: new Date(),
        edits: [],
        byCommenter: false,
      },
      {
        uuid: "98752639503826",
        text: "K just checking",
        time: new Date(),
        edits: [],
        byCommenter: true,
      },
    ],
  },
  {
    uuid: "3685761585957453",
    text: "I don't like this",
    time: new Date(),
    edits: [],
    commenter: {
      id: 6926539486,
      name: "Steve",
    },
    replies: [
      {
        uuid: "3267849846628993",
        text: "There's no need to be rude",
        time: new Date(),
        byCommenter: false,
        edits: [],
      },
      {
        uuid: "64056278673",
        text: "Deal with it",
        time: new Date(),
        edits: [],
        byCommenter: false,
      },
      {
        uuid: "75392870777152425",
        text: "No thank you",
        time: new Date(),
        byCommenter: true,
        edits: [
          {
            text: "You suck",
            time: new Date(),
          },
        ],
      },
      {
        uuid: "76543281977545",
        text: "Have it your way",
        time: new Date(),
        byCommenter: false,
        edits: [
          {
            text: "Fuck off",
            time: new Date(),
          },
        ],
      },
    ],
  },
];
