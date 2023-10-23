import { format } from 'date-fns'

export const Profile = ({ profile }) => {
    const onBack = () => {
        console.log("back")
    }

    const viewRatings = () => {
        console.log("ratings")
    }

    const viewAllOffers = () => {
        console.log("all offers")
    }

    const viewOpenOffers = () => {
        console.log("open offers")
    }

    const viewHitOffers = () => {
        console.log("hit offers")
    }

    const viewMissedOffers = () => {
        console.log("missed offers")
    }

    const viewAllPosts = () => {
        console.log("all posts")
    }

    const viewActivePosts = () => {
        console.log("active posts")
    }

    const viewSoldPosts = () => {
        console.log("sold posts")
    }

    const viewInactivePosts = () => {
        console.log("inactive posts")
    }

    const viewFirstPost = () => {
        console.log("first post")
    }

    const viewMostRecentPost = () => {
        console.log("most recent post")
    }

    const viewOldestActivePost = () => {
        console.log("oldest active post")
    }

    const viewSets = () => {
        console.log("sets")
    }

    return (
        <div className="p-2 pt-5 h-full flex justify-center">
            <div className="w-full max-w-md flex flex-col justify-between">
                <div>
                    <div className="text-center mb-3 cursor-pointer" onClick={viewRatings}>
                        <p className="text-xl">{profile.name}</p>
                        <p className="pb-1">{profile.rating} ({profile.numRatings} {profile.numRatings == 1 ? "rating" : "ratings"})</p>
                        <p className="text-sm">{profile.location}</p>
                    </div>
                    <div className="mb-4">
                        <p className="font-bold p-2 cursor-pointer" onClick={viewAllOffers}>{profile.offers.total} {profile.offers.total == 1 ? "Offer" : "Offers"}</p>
                        <div className="bg-neutral-100 py-2 flex justify-between">
                            <p>
                                <span className="cursor-pointer p-2" onClick={viewOpenOffers}>open</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewHitOffers}>hit</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewMissedOffers}>missed</span>
                            </p>
                            <p>
                                <span className="cursor-pointer p-2" onClick={viewOpenOffers}>{profile.offers.open}</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewHitOffers}>{profile.offers.hit}</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewMissedOffers}>{profile.offers.missed}</span>
                            </p>
                        </div>
                    </div>
                    <div className="mb-2">
                        <p className="font-bold p-2 cursor-pointer" onClick={viewAllPosts}>{profile.posts.total} {profile.posts.total == 1 ? "Post" : "Posts"}, {profile.posts.replies} {profile.posts.replies == 1 ? "Reply" : "Replies"}</p>
                        <div className="bg-neutral-100 py-2 flex justify-between">
                            <p>
                                <span className="cursor-pointer p-2" onClick={viewActivePosts}>active</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewSoldPosts}>sold</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewInactivePosts}>inactive</span>
                            </p>
                            <p>
                                <span className="cursor-pointer p-2" onClick={viewActivePosts}>{profile.posts.active}</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewSoldPosts}>{profile.posts.sold}</span>
                                <span>/</span>
                                <span className="cursor-pointer p-2" onClick={viewInactivePosts}>{profile.posts.inactive}</span>
                            </p>
                        </div>
                        <p className="p-2 flex justify-between cursor-pointer" onClick={viewFirstPost}>
                            <span>first</span>
                            <span>{format(profile.posts.first, "dd/MM/yy")}</span>
                        </p>
                        <p className="bg-neutral-100 p-2 flex justify-between cursor-pointer" onClick={viewMostRecentPost}>
                            <span>most recent</span>
                            <span>{format(profile.posts.mostRecent, "dd/MM/yy")}</span>
                        </p>
                        <p className="p-2 flex justify-between cursor-pointer" onClick={viewOldestActivePost}>
                            <span>oldest active</span>
                            <span>{format(profile.posts.oldestActive, "dd/MM/yy")}</span>
                        </p>
                    </div>
                </div>
                <div>
                    <p className="font-bold text-lg px-2 cursor-pointer" onClick={onBack}>{"<"}</p>
                </div>
            </div>
        </div>
    )
}

export const fakeProfile = {
    id: "765426834098",
    name: "Douglas",
    rating: 4.5,
    numRatings: 10,
    location: "123 Bender Street, Canada",
    language: "english",
    posts: {
        total: 5,
        active: 2,
        inactive: 1, // either deleted or draft
        sold: 2,
        replies: 29, // only to our posts
        first: new Date(),
        mostRecent: new Date(),
        oldestActive: new Date(),
    },
    offers: {
        total: 3,
        open: 1, // post has not been sold or deleted
        hit: 1, // post has been sold to us
        missed: 1, // post had been sold, deleted, or our offer has been deleted
    },
}