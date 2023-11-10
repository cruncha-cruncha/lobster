import { format } from "date-fns";
import { useRouter } from "../components/Router/Router";

export const useProfile = ({ data }) => {
  const router = useRouter();

  const viewRatings = ({ user_id }) => {
    console.log("ratings");
  };

  const viewAllOffers = ({ user_id }) => {
    console.log("all offers");
  };

  const viewOpenOffers = ({ user_id }) => {
    console.log("open offers");
  };

  const viewHitOffers = ({ user_id }) => {
    console.log("hit offers");
  };

  const viewMissedOffers = ({ user_id }) => {
    console.log("missed offers");
  };

  const viewAllPosts = ({ user_id }) => {
    console.log("all posts");
  };

  const viewActivePosts = ({ user_id }) => {
    console.log("active posts");
  };

  const viewSoldPosts = ({ user_id }) => {
    console.log("sold posts");
  };

  const viewDraftPosts = ({ user_id }) => {
    console.log("draft posts");
  };

  const viewFirstPost = ({ user_id }) => {
    console.log("first post");
  };

  const viewMostRecentPost = ({ user_id }) => {
    console.log("most recent post");
  };

  const viewOldestActivePost = ({ user_id }) => {
    console.log("oldest active post");
  };

  const onPost = () => {
    router.goTo("/post");
  };

  const onSearch = () => {
    console.log("search");
  };

  const onAccount = () => {
    router.goTo("/account");
  }

  return {
    data,
    onBack: router.goBack,
    canGoBack: router.canGoBack,
    viewRatings,
    viewAllOffers,
    viewOpenOffers,
    viewHitOffers,
    viewMissedOffers,
    viewAllPosts,
    viewActivePosts,
    viewSoldPosts,
    viewDraftPosts,
    viewFirstPost,
    viewMostRecentPost,
    viewOldestActivePost,
    onPost,
    onSearch,
    onAccount,
  };
};

export const PureProfile = (profile) => {
  return (
    <div className="flex h-full justify-center">
      <div className="flex w-full max-w-md flex-col justify-between pb-2 pt-5">
        <div>
          <div
            className="mb-3 cursor-pointer text-center"
            onClick={(e) => profile?.viewRatings?.(e)}
          >
            <p className="text-xl">{profile?.data?.name}</p>
            <p className="pb-1">
              {profile?.data?.rating} ({profile?.data?.numRatings}{" "}
              {profile?.data?.numRatings == 1 ? "rating" : "ratings"})
            </p>
            <p className="text-sm">{profile?.data?.location}</p>
          </div>
          <div className="p-2">
            <p
              className="cursor-pointer border-b-2 border-stone-400 p-2 font-bold"
              onClick={(e) => profile?.viewAllOffers?.(e)}
            >
              {profile?.data?.offers?.total}{" "}
              {profile?.data?.offers?.total == 1 ? "Offer" : "Offers"}
            </p>
            <div className="flex justify-between border-b-2 border-stone-200 py-2">
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewOpenOffers?.(e)}
                >
                  open
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewHitOffers?.(e)}
                >
                  hit
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewMissedOffers?.(e)}
                >
                  missed
                </span>
              </p>
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewOpenOffers?.(e)}
                >
                  {profile?.data?.offers?.open}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewHitOffers?.(e)}
                >
                  {profile?.data?.offers?.hit}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewMissedOffers?.(e)}
                >
                  {profile?.data?.offers?.missed}
                </span>
              </p>
            </div>
          </div>
          <div className="p-2">
            <p
              className="cursor-pointer border-b-2 border-stone-400 p-2 font-bold"
              onClick={(e) => profile?.viewAllPosts?.(e)}
            >
              {profile?.data?.posts?.total}{" "}
              {profile?.data?.posts?.total == 1 ? "Post" : "Posts"},{" "}
              {profile?.data?.posts?.replies}{" "}
              {profile?.data?.posts?.replies == 1 ? "Reply" : "Replies"}
            </p>
            <div className="flex justify-between border-b-2 border-stone-200 py-2">
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewActivePosts?.(e)}
                >
                  active
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewDraftPosts?.(e)}
                >
                  drafts
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewSoldPosts?.(e)}
                >
                  sold
                </span>
              </p>
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewActivePosts?.(e)}
                >
                  {profile?.data?.posts?.active}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewDraftPosts?.(e)}
                >
                  {profile?.data?.posts?.drafts}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={(e) => profile?.viewSoldPosts?.(e)}
                >
                  {profile?.data?.posts?.sold}
                </span>
              </p>
            </div>
            <p
              className="flex cursor-pointer justify-between border-b-2 border-stone-200 p-2"
              onClick={(e) => profile?.viewFirstPost?.(e)}
            >
              <span>first</span>
              <span>
                {profile?.data?.posts?.first
                  ? format(profile?.data?.posts?.first, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p
              className="flex cursor-pointer justify-between border-b-2 border-stone-200 p-2"
              onClick={(e) => profile?.viewMostRecentPost?.(e)}
            >
              <span>most recent</span>
              <span>
                {profile?.data?.posts?.mostRecent
                  ? format(profile?.data?.posts?.mostRecent, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p
              className="flex cursor-pointer justify-between border-b-2 border-stone-200 p-2"
              onClick={(e) => profile?.viewOldestActivePost?.(e)}
            >
              <span>oldest active</span>
              <span>
                {profile?.data?.posts?.oldestActive
                  ? format(profile?.data?.posts?.oldestActive, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p className="flex justify-between border-b-2 border-stone-200 p-2">
              <span>deleted</span>
              <span>{profile?.data?.posts?.deleted}</span>
            </p>
          </div>
        </div>
        <div
          className={
            "flex" + (profile?.canGoBack ? " justify-between" : " justify-end")
          }
        >
          {profile?.canGoBack && (
            <p
              className="cursor-pointer p-2 text-lg font-bold"
              onClick={(e) => profile?.onBack?.(e)}
            >
              {"<"}
            </p>
          )}
          <div className="flex gap-x-2 pr-2">
            <button
              className="rounded-full bg-sky-200 px-4 py-2 hover:bg-sky-900 hover:text-white transition-colors"
              onClick={(e) => profile?.onAccount?.(e)}
            >
              Account
            </button>
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white transition-colors"
              onClick={(e) => profile?.onPost?.(e)}
            >
              Post
            </button>
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white transition-colors"
              onClick={(e) => profile?.onSearch?.(e)}
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Profile = (props) => {
  const profile = useProfile(props);
  return <PureProfile {...profile} />;
};

export const fakeData = {
  id: 765426834098,
  name: "Douglas",
  rating: 4.5,
  numRatings: 10,
  location: "123 Bender Street, Canada",
  language: "english",
  posts: {
    total: 5,
    active: 2,
    drafts: 1, // either deleted or draft
    deleted: 1,
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
};
