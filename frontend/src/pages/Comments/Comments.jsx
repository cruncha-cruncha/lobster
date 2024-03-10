import { useReducer, useState, useEffect } from "react";
import { useRouter, getQueryParams } from "../../components/router/Router";
import { Comment } from "./Comment";
import * as endpoints from "../../api/endpoints";
import { useAuth } from "../../components/userAuth";
import { useInfoModal, PureInfoModal } from "../../components/InfoModal";
import { parseDate } from "../../api/parseDate";
import { formatData as formatPostData } from "../Post";

export const formatReply = (data, commentAuthorId, userId) => ({
  uuid: data.uuid,
  text: data.content,
  time: parseDate(data.updated_at),
  byCommenter: commentAuthorId === data.author_id,
  edits: data.changes,
  canEdit: data.author_id === userId,
  deleted: data.deleted,
  loading: false,
});

export const formatComment = (data, userId) => ({
  uuid: data.uuid,
  text: data.content,
  time: parseDate(data.updated_at),
  canEdit: data.author_id === userId,
  loading: false,
  deleted: data.deleted,
  commenter: {
    id: data.author_id,
    name: data.author_id == userId ? "you" : data.author_name,
  },
  edits: data.changes,
  replies: (data?.replies || []).map((reply) =>
    formatReply(reply, data.author_id, userId),
  ),
});

export const formatData = (allComments, userId) => {
  return allComments.map((data) => formatComment(data, userId));
};

function reducer(state, action) {
  switch (action?.type) {
    case "setText":
      return { ...state, text: action?.payload?.text };
    case "setActiveComment":
      return {
        ...state,
        text: "",
        activeCommentUuid:
          state.activeCommentUuid == action?.payload?.uuid
            ? ""
            : action?.payload?.uuid,
        editing: { amEditing: false, originalText: "", parent: "", uuid: "" },
      };
    case "editComment":
      return {
        ...state,
        text: action?.payload?.text,
        activeCommentUuid: action?.payload?.uuid,
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
        activeCommentUuid: action?.payload?.parent,
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
        activeCommentUuid: "",
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
      console.error("uncaught reduce ", action);
  }

  return state;
}

export const useComments = () => {
  const auth = useAuth();
  const router = useRouter();
  const modal = useInfoModal();
  const [post, setPost] = useState({});
  const [networkData, setNetworkData] = useState([]);
  const [data, setData] = useState([]);
  const [state, dispatch] = useReducer(reducer, {
    text: "",
    activeCommentUuid: "",
    editing: {
      amEditing: false,
      originalText: "",
      parent: "",
      uuid: "",
    },
  });

  useEffect(() => {
    if (!auth?.user?.userId || !networkData) return;
    setData(formatData(networkData, auth.user.userId));
  }, [auth?.user, networkData]);

  const queryParams = getQueryParams();
  const postUuid = queryParams.get("uuid");

  const myComment = data.find(
    (comment) => comment.commenter.id == auth?.user?.userId,
  );

  const amPoster =
    !!post?.author?.id && post?.author?.id === auth?.user?.userId;
  const amCommenter = !!myComment && !myComment?.deleted;
  const amViewer = !amPoster && !amCommenter;

  const textControls = (() => {
    if (state.editing.amEditing) {
      return {
        placeholder: "Edit",
        inputDisabled: false,
        buttonText: "Edit",
        submitDisabled: state.text == state.editing.originalText || !state.text,
      };
    } else if (amPoster) {
      if (state.activeCommentUuid) {
        return {
          placeholder: "Reply",
          inputDisabled: false,
          buttonText: "Reply",
          submitDisabled: !state.text,
        };
      } else if (data.length <= 0) {
        return {
          placeholder: "No comments yet",
          inputDisabled: true,
          buttonText: "Reply",
          submitDisabled: true,
        };
      } else {
        return {
          placeholder: "Select a comment to reply",
          inputDisabled: true,
          buttonText: "Reply",
          submitDisabled: true,
        };
      }
    } else if (amCommenter) {
      if (state.activeCommentUuid == myComment?.uuid) {
        return {
          placeholder: "Reply",
          inputDisabled: false,
          buttonText: "Reply",
          submitDisabled: !state.text,
        };
      } else {
        return {
          placeholder: "Select your comment to reply",
          inputDisabled: true,
          buttonText: "Reply",
          submitDisabled: true,
        };
      }
    } else {
      return {
        placeholder: "Comment",
        inputDisabled: false,
        buttonText: "Comment",
        submitDisabled: !state.text,
      };
    }
  })();

  const setText = (text) => {
    dispatch({ type: "setText", payload: { text } });
  };

  useEffect(() => {
    let mounted = true;

    endpoints
      .getPostComments({
        accessToken: auth?.accessToken,
        uuid: postUuid,
      })
      .then((res) => {
        if (!mounted || res.status !== 200) return;
        setNetworkData(res.data);
      });

    endpoints
      .getPost({
        accessToken: auth?.accessToken,
        uuid: postUuid,
      })
      .then((res) => {
        if (!mounted || res.status !== 200) return;
        setPost(formatPostData(res.data));
      });

    return () => {
      mounted = false;
    };
  }, []);

  const applyReplyEdit = () => {
    setData((prev) => {
      return prev.map((comment) => {
        if (comment.uuid == state.editing.parent) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.uuid == state.editing.uuid) {
                return {
                  ...reply,
                  text: state.text,
                  loading: true,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      });
    });

    dispatch({ type: "clearText" });

    endpoints
      .updateReply({
        accessToken: auth.accessToken,
        uuid: state.editing.uuid,
        data: {
          content: state.text,
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          modal.open("Update failed. Please try again later.", "error");
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.editing.parent) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == state.editing.uuid) {
                      return {
                        ...reply,
                        text: state.editing.originalText,
                        loading: false,
                      };
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            }),
          );
        } else {
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.editing.parent) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == state.editing.uuid) {
                      return formatReply(
                        res.data,
                        comment.commenter.id,
                        auth?.user?.userId,
                      );
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            }),
          );
        }
      });
  };

  const applyCommentEdit = () => {
    setData((prev) =>
      prev.map((comment) => {
        if (comment.uuid == state.editing.uuid) {
          return {
            ...comment,
            text: state.text,
            loading: true,
          };
        }

        return comment;
      }),
    );

    dispatch({ type: "clearText" });

    endpoints
      .updateComment({
        accessToken: auth.accessToken,
        uuid: state.editing.uuid,
        data: {
          content: state.text,
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          modal.open("Update failed. Please try again later.", "error");
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.editing.uuid) {
                return {
                  ...comment,
                  text: state.editing.originalText,
                  loading: false,
                };
              }

              return comment;
            }),
          );
        } else {
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.editing.uuid) {
                return {
                  ...formatComment(res.data, auth?.user?.userId),
                  replies: comment.replies,
                };
              }
              return comment;
            }),
          );
        }
      });
  };

  const makeNewComment = (tmpFakeUuid) => {
    const newComment = {
      uuid: tmpFakeUuid,
      text: state.text,
      time: new Date(),
      canEdit: true,
      loading: true,
      commenter: {
        id: auth?.user?.userId,
        name: "you",
      },
      edits: [],
      replies: [],
    };

    setData((prev) => [
      newComment,
      ...prev.map((comment) => {
        if (comment.uuid == myComment?.uuid) {
          return {
            ...comment,
            loading: true,
          };
        }
        return comment;
      }),
    ]);

    dispatch({ type: "clearText" });

    endpoints
      .createNewComment({
        accessToken: auth.accessToken,
        data: {
          post_uuid: post?.uuid,
          content: state.text,
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          modal.open("Comment failed. Please try again later.", "error");
          setData((prev) =>
            prev
              .filter((comment) => comment.uuid != tmpFakeUuid)
              .map((comment) => {
                if (comment.uuid == myComment?.uuid) {
                  return {
                    ...comment,
                    loading: false,
                  };
                }
                return comment;
              }),
          );
        } else {
          let replies = [];
          setData((prev) =>
            prev
              .filter((comment) => {
                if (comment.uuid == myComment?.uuid) {
                  replies = comment.replies;
                  return false;
                }
                return true;
              })
              .map((comment) => {
                if (comment.uuid == tmpFakeUuid) {
                  return {
                    ...formatComment(res.data, auth?.user?.userId),
                    replies: replies,
                  };
                }
                return comment;
              }),
          );
        }
      });
  };

  const makeNewReply = (tmpFakeUuid) => {
    setData((prev) => {
      return prev.map((comment) => {
        if (comment.uuid == state.activeCommentUuid) {
          const newReply = {
            uuid: tmpFakeUuid,
            text: state.text,
            time: new Date(),
            byCommenter: comment.commenter.id === auth?.user?.userId,
            edits: [],
            canEdit: true,
            loading: true,
          };

          return {
            ...comment,
            replies: [...comment.replies, newReply],
          };
        }

        return comment;
      });
    });

    dispatch({ type: "clearText" });

    endpoints
      .createNewReply({
        accessToken: auth?.accessToken,
        data: {
          comment_uuid: state.activeCommentUuid,
          content: state.text,
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          modal.open("Reply failed. Please try again later.", "error");

          setData((prev) => {
            return prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.filter(
                    (reply) => reply.uuid != tmpFakeUuid,
                  ),
                };
              }

              return comment;
            });
          });
        } else {
          setData((prev) => {
            return prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == tmpFakeUuid) {
                      return formatReply(
                        res.data,
                        comment.commenter.id,
                        auth?.user?.userId,
                      );
                    }

                    return reply;
                  }),
                };
              }

              return comment;
            });
          });
        }
      });
  };

  const onSubmitText = () => {
    const tmpFakeUuid = `tmp-fake-uuid-${Math.random()}`;

    if (state.editing.amEditing) {
      dispatch({ type: "clearEditing" });
      if (state.editing.parent) {
        applyReplyEdit();
      } else {
        applyCommentEdit();
      }
    } else if (amViewer) {
      makeNewComment(tmpFakeUuid);
    } else {
      makeNewReply(tmpFakeUuid);
    }
  };

  const undeleteMyComment = () => {
    dispatch({
      type: "setActiveComment",
      payload: { uuid: myComment?.uuid },
    });

    setData((prev) => [
      ...prev.map((comment) => {
        if (comment.uuid == myComment?.uuid) {
          return {
            ...comment,
            loading: true,
          };
        }
        return comment;
      }),
    ]);

    endpoints
      .createNewComment({
        accessToken: auth.accessToken,
        data: {
          post_uuid: post?.uuid,
          content: myComment?.text,
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          modal.open(
            "Could not retrieve comment. Please try again later.",
            "error",
          );
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == myComment?.uuid) {
                return {
                  ...comment,
                  loading: false,
                };
              }
              return comment;
            }),
          );
        } else {
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == myComment?.uuid) {
                return {
                  ...comment,
                  loading: false,
                  deleted: false,
                };
              }
              return comment;
            }),
          );
        }
      });
  };

  const undeleteReply = (uuid) => {
    setData((prev) => {
      return prev.map((comment) => {
        if (comment.uuid == state.activeCommentUuid) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.uuid == uuid) {
                return {
                  ...reply,
                  loading: true,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      });
    });

    endpoints
      .undeleteReply({
        accessToken: auth.accessToken,
        uuid,
      })
      .then((res) => {
        if (res.status != 200) {
          modal.open(
            "Could not retrieve reply. Please try again later.",
            "error",
          );
          setData((prev) => {
            return prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == uuid) {
                      return {
                        ...reply,
                        loading: false,
                      };
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            });
          });
        } else {
          setData((prev) => {
            return prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == uuid) {
                      return formatReply(
                        res.data,
                        comment.commenter.id,
                        auth?.user?.userId,
                      );
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            });
          });
        }
      });
  };

  const removeComment = (uuid) => {
    if (state.activeCommentUuid == uuid) {
      dispatch({ type: "clearAll" });
    }
    setData((prev) =>
      prev.map((comment) => {
        if (comment.uuid == uuid) {
          return {
            ...comment,
            loading: true,
          };
        }
        return comment;
      }),
    );
    endpoints
      .removeComment({
        accessToken: auth?.accessToken,
        uuid,
      })
      .then((res) => {
        if (res.status !== 204) {
          modal.open(
            "Could not remove comment. Please try again later.",
            "error",
          );
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == uuid) {
                return {
                  ...comment,
                  loading: false,
                };
              }
              return comment;
            }),
          );
        } else {
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == uuid) {
                return {
                  ...comment,
                  time: new Date(),
                  loading: false,
                  deleted: true,
                };
              }
              return comment;
            }),
          );
        }
      });
  };

  const removeReply = (uuid) => {
    if (
      state.editing.amEditing &&
      state.editing.uuid == action?.payload?.uuid
    ) {
      dispatch({ type: "clearEditing" });
    }

    setData((prev) =>
      prev.map((comment) => {
        if (comment.uuid == state.activeCommentUuid) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.uuid == uuid) {
                return {
                  ...reply,
                  loading: true,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      }),
    );

    endpoints
      .removeReply({
        accessToken: auth?.accessToken,
        uuid,
      })
      .then((res) => {
        if (res.status !== 204) {
          modal.open(
            "Could not remove reply. Please try again later.",
            "error",
          );
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == uuid) {
                      return {
                        ...reply,
                        loading: false,
                      };
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            }),
          );
        } else {
          setData((prev) =>
            prev.map((comment) => {
              if (comment.uuid == state.activeCommentUuid) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                    if (reply.uuid == uuid) {
                      return {
                        ...reply,
                        time: new Date(),
                        loading: false,
                        deleted: true,
                      };
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            }),
          );
        }
      });
  };

  const MoreDispatch = (action) => {
    switch (action?.type) {
      case "undeleteComment":
        if (action?.payload?.uuid != myComment?.uuid) return;
        undeleteMyComment();
        break;
      case "undeleteReply":
        undeleteReply(action?.payload?.uuid);
        break;
      case "removeComment":
        removeComment(action?.payload?.uuid);
        break;
      case "removeReply":
        removeReply(action?.payload?.uuid);
        break;
      default:
        dispatch(action);
    }
  };

  const onBack = () => {
    router.goTo(`/post?uuid=${postUuid}`, "right");
  };

  return {
    data,
    modal,
    dispatch: MoreDispatch,
    activeCommentUuid: state.activeCommentUuid,
    textControls,
    text: state.text,
    setText,
    onSubmitText,
    onBack,
  };
};

export const PureComments = (comments) => {
  return (
    <>
      <PureInfoModal {...comments?.modal} />
      <div className="flex h-full justify-center">
        <div className="flex min-h-full max-w-3xl grow flex-col justify-between pb-2">
          <div className="w-full">
            {comments?.data?.map((data, i) => (
              <Comment
                key={data?.uuid}
                dispatch={comments?.dispatch}
                isActive={data?.uuid == comments?.activeCommentUuid}
                darkBg={i % 2 == 0}
                data={data}
              />
            ))}
          </div>
          <div className="flex px-2">
            <div className="mr-2">
              <p
                className="hide-while-sliding relative top-2 cursor-pointer pr-2 text-lg font-bold"
                onClick={(e) => comments?.onBack?.(e)}
              >
                {"<"}
              </p>
            </div>
            <form className="flex grow flex-row">
              <input
                className={
                  "mr-2 grow rounded-sm border-b-2 border-stone-800 p-2 ring-sky-500 focus-visible:outline-none focus-visible:ring-2" +
                  (comments?.textControls?.inputDisabled
                    ? " text-neutral-500"
                    : "")
                }
                type="text"
                placeholder={comments?.textControls?.placeholder}
                disabled={comments?.textControls?.inputDisabled}
                value={comments?.text}
                onChange={(e) => {
                  comments?.setText?.(e.target.value);
                }}
              />
              <button
                className={
                  "rounded-full px-4 py-2 transition-colors" +
                  (comments?.textControls?.submitDisabled
                    ? " bg-stone-300 text-white"
                    : " bg-emerald-200 hover:bg-emerald-900 hover:text-white")
                }
                type="button"
                disabled={comments?.textControls?.submitDisabled}
                onClick={(e) => comments?.onSubmitText?.(e)}
              >
                {comments?.textControls?.buttonText}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export const Comments = (props) => {
  const comments = useComments(props);
  return <PureComments {...comments} />;
};
