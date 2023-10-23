import { useState } from "react"
import { format } from 'date-fns'

export const Comments = ({ postData, comments }) => {
    const [activeComment, setActiveComment] = useState("");
    const [reply, setReply] = useState("");

    const onReply = () => {
        console.log("reply");
    }

    const handleClickComment = (uuid) => {
        setActiveComment(prev => {
            if (prev !== uuid) {
                return uuid;
            } else {
                return "";
            }
        });
    }

    const onBack = () => {
        console.log("back");
    }

    return (
        <div className="min-h-full w-full flex flex-col justify-between pb-2">
            <div className="w-full">
                {comments.map((comment, i) => (
                    <Comment
                        key={comment.uuid}
                        onClick={() => handleClickComment(comment.uuid)}
                        isActive={comment.uuid == activeComment}
                        darkBg={i % 2 == 0}
                        data={comment}
                    />
                ))}
            </div>
            <div className="flex px-2">
                <div className="cursor-pointer mr-2" onClick={() => { }}>
                    <p className="font-bold text-lg pr-2 relative top-2" onClick={onBack}>{"<"}</p>
                </div>
                <form className="flex flex-row grow" onSubmit={() => { }}>
                    <input
                        className={"grow mr-2 rounded p-2 " + (activeComment == "" ? "text-neutral-500" : "")}
                        type="text"
                        placeholder={!activeComment ? "select a comment to reply" : "reply"}
                        disabled={activeComment == ""}
                        value={reply}
                        onChange={(e) => { setReply(e.target.value) }}
                    />
                    <button
                        className={"rounded-md px-4 py-2 border-2 " + ((!activeComment || !reply) ? "border-neutral-400 text-neutral-500" : "bg-emerald-100 border-white hover:bg-emerald-900 hover:text-white")}
                        type="button"
                        disabled={!activeComment || !reply}
                        onClick={onReply}
                    >Reply</button>
                </form>
            </div>
        </div>
    )
}

export const Comment = ({ onClick, darkBg, data, isActive }) => {

    const onSeeEdits = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("see edits for comment " + data.uuid);
    }

    const onRemove = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("remove comment " + data.uuid);
    }

    const onDeleted = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("undelete comment " + data.uuid);
    }

    const onFlag = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("flag comment " + data.uuid);
    }

    const onEdit = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("edit comment " + data.uuid);
    }

    const viewCommenter = (e) => {
        if (isActive) {
            e.stopPropagation();
        }

        console.log("view commenter " + data.commenter.id);
    }

    if (data.deleted) {
        return (
            <div onClick={onDeleted} className={"py-1 pl-1 " + (darkBg ? "border-l-4 border-neutral-100 bg-neutral-100" : "border-l-4 border-white")}>
                <div className="flex flex-row justify-between text-sm italic">
                    <p>deleted, {format(data.time, "HH:mm dd/MM")}</p>
                </div>
            </div>
        );
    }

    return (
        <div onClick={onClick} className={"py-1 " + (darkBg ? "border-l-4 border-neutral-100 bg-neutral-100" : "border-l-4 border-white")}>
            <div className="pl-1 py-1">
                <div className="flex flex-row justify-between pr-2 mb-0.5">
                    <p>{data.text}</p>
                    <p className="ml-2">{data.replies.length}</p>
                </div>
                <div className="flex flex-row justify-between text-sm">
                    <p className="italic">
                        <span className="cursor-pointer" onClick={viewCommenter}>{data.commenter.name}, </span>
                        <span>{format(data.time, "HH:mm dd/MM")}</span>
                        {data.edits?.length ? (<span className="cursor-pointer" onClick={onSeeEdits}>, edited</span>) : ""}
                    </p>
                    <div className="flex flex-row">
                        <p className="px-1 cursor-pointer" onClick={onEdit}>edit</p>
                        <p className="px-1 cursor-pointer" onClick={onFlag}>flag</p>
                        <p className="pl-1 pr-2 cursor-pointer" onClick={onRemove}>&ndash;</p>
                    </div>
                </div>
            </div>
            <div className={"transition-height duration-300 ease-out " + (isActive ? "overflow-y-scroll max-h-96" : "overflow-y-hidden max-h-0")}>
                {data.replies.map((reply) => (
                    <Reply
                        key={reply.uuid}
                        data={reply}
                    />
                ))}
            </div>
        </div>
    )
}

export const Reply = ({ data }) => {

    const onSeeEdits = (e) => {
        e.stopPropagation();
        console.log("see edits for reply " + data.uuid);
    }

    const onRemove = (e) => {
        e.stopPropagation();
        console.log("remove reply " + data.uuid);
    }

    const onDeleted = (e) => {
        e.stopPropagation();
        console.log("undelete reply " + data.uuid);
    }

    const onFlag = (e) => {
        e.stopPropagation();
        console.log("flag reply " + data.uuid);
    }

    const onEdit = (e) => {
        e.stopPropagation();
        console.log("edit reply " + data.uuid);
    }

    if (data.deleted) {
        return (
            <div onClick={onDeleted} className={"pl-2 py-1 italic rounded-l-lg " + (!data.byCommenter ? "bg-sky-200" : "")}>
                <p className="text-sm">deleted, {format(data.time, "HH:mm dd/MM")}</p>
            </div>
        );
    }

    return (
        <div className={"pl-2 py-1 rounded-l-lg " + (!data.byCommenter ? "bg-sky-200" : "")}>
            <div className="flex pr-2 flex-row justify-between mb-0.5">
                <p>{data.text}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
                <p className="italic">
                    <span>{format(data.time, "HH:mm dd/MM")}</span>
                    {data.edits?.length ? (<span className="cursor-pointer" onClick={onSeeEdits}>, edited</span>) : ""}
                </p>
                <div className="flex flex-row">
                    <p className="px-1 cursor-pointer" onClick={onEdit}>edit</p>
                    <p className="px-1 cursor-pointer" onClick={onFlag}>flag</p>
                    <p className="pl-1 pr-2 cursor-pointer" onClick={onRemove}>&ndash;</p>
                </div>
            </div>
        </div>
    )
}

export const fakePostData = {
    uuid: "63856492738",
}

export const fakeComments = [
    {
        uuid: "971468364529",
        text: "Hello! First!1! I'm here!",
        time: new Date(), // when it was last edited
        commenter: {
            id: "79283683716",
            name: "Annoying Guy",
        },
        edits: [
            {
                text: "Hello! First!1!",
                time: new Date(),
            }
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
            id: "7621039864",
            name: "Mabel",
        },
    },
    {
        uuid: "897687912573",
        text: "Is this still available? I like it but not like like like it, so I'm not willing to put in much effort.",
        time: new Date(),
        commenter: {
            id: "6926539486",
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
            }
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
                    }
                ]
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
            }
        ],
    },
    {
        uuid: "12835629945418",
        text: "Does it still work?",
        time: new Date(),
        commenter: {
            id: "38745541827",
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
            id: "6926539486",
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
                    }
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
                    }
                ]
            },
        ],
    },
]