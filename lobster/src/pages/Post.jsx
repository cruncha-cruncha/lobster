import { useState } from "react"
import { format } from 'date-fns'

export const Post = ({ post }) => {
    const [offer, setOffer] = useState("")

    const viewEdits = () => {
        console.log("see edits")
    }

    const onFlag = () => {
        console.log("flag")
    }

    const viewAuthor = () => {
        console.log("author")
    }

    const onPost = (e) => {
        console.log("post")
    }

    const onBack = () => {
        console.log("back")
    }

    const viewOffers = () => {
        console.log("offers")
    }

    const viewLocation = () => {
        console.log("location")
    }

    return (
        <div className="text-left min-h-full flex flex-col justify-between py-2">
            <div className="px-2">
                <h1 className="text-2xl mb-2 cursor-pointer" onClick={viewAuthor}>Incredible Bicycle! 56 Speed! Super fast! Wow!</h1>
                <div className="float-left mr-2 min-w-full sm:min-w-min bg-yellow-400 mb-2">
                    <div className="sm:w-64 h-64 flex flex-row justify-center items-center">
                        <span>image area</span>
                    </div>
                </div>
                <div>
                    <p>
                        <span>{post.description}</span>
                        <span className="italic">
                            <span> - </span>
                            <span className="italic cursor-pointer" onClick={viewAuthor}>{post.author.name}</span>
                            <span>, {format(post.time, "dd/MM/yy")}</span>
                            {post.edits.length ? (
                                <>
                                    <span>, </span>
                                    <span onClick={viewEdits} className="cursor-pointer">edited</span>
                                </>
                            ) : ""}
                        </span>
                    </p>
                </div>
                <div className="flex flex-row justify-between items-center mt-2">
                    <div>
                        <button onClick={onFlag} className="px-2 py-1 bg-orange-300 rounded hover:bg-orange-900 hover:text-white">Flag</button>
                    </div>
                    <div className="text-right">
                        <p onClick={viewLocation} className="cursor-pointer">{post.location}</p>
                        <p>{post.price}</p>
                    </div>
                </div>
            </div>
            <div>
                <div className="px-2 mt-2">
                    <form className="flex flex-row" onSubmit={() => { }}>
                        <input
                            className="grow mr-2 rounded p-2"
                            type="text"
                            placeholder="make an offer"
                            value={offer}
                            onChange={(e) => { setOffer(e.target.value); }}
                        />
                        <button
                            className={"rounded-md px-4 py-2 border-2 " + (offer.length ? "bg-emerald-100 hover:bg-emerald-900 hover:text-white border-white" : "border-neutral-400 text-neutral-500")}
                            type="button"
                            onClick={onPost}
                            disabled={!offer.length}
                        >Post</button>
                    </form>
                </div>
                <div className="flex flex-row justify-between leading-6 mt-2">
                    <div className="cursor-pointer px-2" onClick={onBack}>
                        <p className="font-bold text-lg">{"<"}</p>
                    </div>
                    <div className="cursor-pointer px-2" onClick={viewOffers}>
                        <p className="text-sm relative bottom-0.5">offers<span className="relative top-0.5 font-bold text-lg pl-1">{">"}</span></p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const fakePost = {
    uuid: "63856492738",
    time: new Date(), // when it was last edited
    title: "Incredible Bicycle! 56 Speed! Super fast! Wow!",
    images: [],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper mauris augue, vitae sodales odio blandit vel. Curabitur a nisi massa. Nam quis sagittis felis. Nunc feugiat mauris sit amet dolor interdum maximus. Cras semper orci odio, non efficitur arcu aliquet sit amet. In ornare cursus augue. Ut ut sem pulvinar, tincidunt purus vel, convallis velit. Proin fringilla ullamcorper enim et lacinia. Proin mollis dictum ipsum sed faucibus. Fusce laoreet rutrum erat in dapibus. Donec risus tortor, varius ut risus in, aliquam condimentum purus. Nulla euismod eros sed egestas dapibus. Proin eu arcu sed lectus fermentum vestibulum ut ac lorem. Sed id nunc eu neque elementum lobortis. Sed ut nisi facilisis, sodales erat sit amet, ultricies libero.",
    author: {
        id: "765426834098",
        name: "Douglas",
    },
    location: "123 Bender Street",
    price: "$12 CAD",
    edits: [
        {
            draft: false,
            time: new Date(),
        },
        {
            title: "Incredible Bicycle! 56 Speed! Super fast! Wow!",
            images: [],
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper mauris augue, vitae sodales odio blandit vel. Curabitur a nisi massa. Nam quis sagittis felis. Nunc feugiat mauris sit amet dolor interdum maximus. Cras semper orci odio, non efficitur arcu aliquet sit amet. In ornare cursus augue. Ut ut sem pulvinar, tincidunt purus vel, convallis velit. Proin fringilla ullamcorper enim et lacinia. Proin mollis dictum ipsum sed faucibus. Fusce laoreet rutrum erat in dapibus. Donec risus tortor, varius ut risus in, aliquam condimentum purus. Nulla euismod eros sed egestas dapibus. Proin eu arcu sed lectus fermentum vestibulum ut ac lorem. Sed id nunc eu neque elementum lobortis. Sed ut nisi facilisis, sodales erat sit amet, ultricies libero.",
            location: "123 Bender Street",
            price: "$12 CAD",
            draft: true,
            time: new Date(),
        }
    ]
}