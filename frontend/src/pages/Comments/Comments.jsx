import { useReducer, useState, useEffect } from "react";
import { Comment } from "./Comment";

function reducer(state, action) {
  switch (action?.type) {
    case "setText":
      return { ...state, text: action?.payload?.text };
    case "setActiveComment":
      if (state.activeComment == action?.payload?.uuid) {
        return { ...state, activeComment: "" };
      } else {
        return {
          ...state,
          activeComment: action?.payload?.uuid,
          editing: { amEditing: false, originalText: "", parent: "", uuid: "" },
        };
      }
    case "editComment":
      return {
        ...state,
        text: action?.payload?.text,
        activeComment: action?.payload?.uuid,
        editing: {
          amEditing: true,
          originalText: action?.payload?.text,
          parent: "",
          uuid: action?.payload?.uuid,
        },
      };
    case "editReply":
      return {
        ...state,
        text: action?.payload?.text,
        activeComment: action?.payload?.parent,
        editing: {
          amEditing: true,
          originalText: action?.payload?.text,
          parent: action?.payload?.parent,
          uuid: action?.payload?.uuid,
        },
      };
    case "clearAll":
      return {
        ...state,
        text: "",
        activeComment: "",
        editing: { amEditing: false, originalText: "", parent: "", uuid: "" },
      };
    case "clearEditing":
      return {
        ...state,
        text: "",
        editing: { amEditing: false, originalText: "", parent: "", uuid: "" },
      };
    case "clearText":
      return { ...state, text: "" };
    default:
      console.log("uncaught reduce ", action);
  }

  return state;
}

export const useComments = ({ postUuid }) => {
  const [data, setData] = useState(fakeData);
  const [state, dispatch] = useReducer(reducer, {
    text: "",
    activeComment: "",
    editing: {
      amEditing: false,
      originalText: "",
      parent: "",
      uuid: "",
    },
  });

  const setText = (text) => {
    dispatch({ type: "setText", payload: { text } });
  };

  const buttonText = state.editing.amEditing ? "Edit" : "Reply";

  const submitTextDisabled =
    !state.text || (!state.activeComment && !state.editing.amEditing);

  const onSubmitText = () => {
    if (state.editing.amEditing) {
      console.log("edit " + state.editing.uuid + " as " + state.text);
      dispatch({ type: "clearEditing" });
    } else if (state.activeComment) {
      console.log("reply to " + state.activeComment + " as " + state.text);
      dispatch({ type: "clearText" });
    } else {
      console.log("bad text submit");
    }
  };

  const MoreDispatch = (action) => {
    switch (action?.type) {
      case "undeleteComment":
        console.log("undelete comment ", action?.payload);
        dispatch({
          type: "setActiveComment",
          payload: { uuid: action?.payload?.uuid },
        });
        break;
      case "undeleteReply":
        console.log("undelete reply ", action?.payload);
        break;
      case "removeComment":
        console.log("remove comment ", action?.payload);
        if (state.activeComment == action?.payload?.uuid) {
          dispatch({ type: "clearAll" });
        }
        break;
      case "removeReply":
        console.log("remove reply ", action?.payload);
        if (state.editing.amEditing && state.editing.parent == action?.payload?.parent && state.editing.uuid == action?.payload?.uuid) {
          dispatch({ type: "clearEditing" });
        }
        break;
      default:
        dispatch(action);
    }
  };

  const onBack = () => {
    console.log("back to post " + postUuid);
  };

  return {
    data,
    buttonText,
    dispatch: MoreDispatch,
    activeComment: state.activeComment,
    text: state.text,
    setText,
    submitTextDisabled,
    onSubmitText,
    onBack,
  };
};

export const PureComments = (comments) => {
  return (
    <div className="flex min-h-full w-full flex-col justify-between pb-2">
      <div className="w-full">
        {comments?.data?.map((data, i) => (
          <Comment
            key={data?.uuid}
            dispatch={comments?.dispatch}
            isActive={data?.uuid == comments?.activeComment}
            darkBg={i % 2 == 0}
            data={data}
          />
        ))}
      </div>
      <div className="flex px-2">
        <div className="mr-2">
          <p
            className="relative top-2 cursor-pointer pr-2 text-lg font-bold"
            onClick={() => comments?.onBack?.()}
          >
            {"<"}
          </p>
        </div>
        <form className="flex grow flex-row">
          <input
            className={
              "mr-2 grow rounded p-2 " +
              (!comments?.activeComment ? "text-neutral-500" : "")
            }
            type="text"
            placeholder={
              !comments?.activeComment ? "select a comment to reply" : "reply"
            }
            disabled={!comments?.activeComment}
            value={comments?.text}
            onChange={(e) => {
              comments?.setText?.(e.target.value);
            }}
          />
          <button
            className={
              "rounded-md border-2 px-4 py-2 " +
              (!!comments?.submitTextDisabled
                ? "border-neutral-400 text-neutral-500"
                : "border-white bg-emerald-100 hover:bg-emerald-900 hover:text-white")
            }
            type="button"
            disabled={!!comments?.submitTextDisabled}
            onClick={() => comments?.onSubmitText?.()}
          >
            {comments?.buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};

export const Comments = (props) => {
  const comments = useComments(props);
  return <PureComments {...comments} />;
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
