import { format } from "date-fns";

export const useProfile = ({ data }) => {
  const onBack = () => {
    console.log("back");
  };

  const viewRatings = () => {
    console.log("ratings");
  };

  const viewAllOffers = () => {
    console.log("all offers");
  };

  const viewOpenOffers = () => {
    console.log("open offers");
  };

  const viewHitOffers = () => {
    console.log("hit offers");
  };

  const viewMissedOffers = () => {
    console.log("missed offers");
  };

  const viewAllPosts = () => {
    console.log("all posts");
  };

  const viewActivePosts = () => {
    console.log("active posts");
  };

  const viewSoldPosts = () => {
    console.log("sold posts");
  };

  const viewInactivePosts = () => {
    console.log("inactive posts");
  };

  const viewFirstPost = () => {
    console.log("first post");
  };

  const viewMostRecentPost = () => {
    console.log("most recent post");
  };

  const viewOldestActivePost = () => {
    console.log("oldest active post");
  };

  return {
    data,
    onBack,
    viewRatings,
    viewAllOffers,
    viewOpenOffers,
    viewHitOffers,
    viewMissedOffers,
    viewAllPosts,
    viewActivePosts,
    viewSoldPosts,
    viewInactivePosts,
    viewFirstPost,
    viewMostRecentPost,
    viewOldestActivePost,
  };
};

export const Profile = (profile) => {
  return (
    <div className="flex h-full justify-center p-2 pt-5">
      <div className="flex w-full max-w-md flex-col justify-between">
        <div>
          <div
            className="mb-3 cursor-pointer text-center"
            onClick={profile?.viewRatings}
          >
            <p className="text-xl">{profile?.data?.name}</p>
            <p className="pb-1">
              {profile?.data?.rating} ({profile?.data?.numRatings}{" "}
              {profile?.data?.numRatings == 1 ? "rating" : "ratings"})
            </p>
            <p className="text-sm">{profile?.data?.location}</p>
          </div>
          <div className="mb-4">
            <p
              className="cursor-pointer p-2 font-bold"
              onClick={profile?.viewAllOffers}
            >
              {profile?.data?.offers?.total}{" "}
              {profile?.data?.offers?.total == 1 ? "Offer" : "Offers"}
            </p>
            <div className="flex justify-between bg-neutral-100 py-2">
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewOpenOffers}
                >
                  open
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewHitOffers}
                >
                  hit
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewMissedOffers}
                >
                  missed
                </span>
              </p>
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewOpenOffers}
                >
                  {profile?.data?.offers?.open}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewHitOffers}
                >
                  {profile?.data?.offers?.hit}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewMissedOffers}
                >
                  {profile?.data?.offers?.missed}
                </span>
              </p>
            </div>
          </div>
          <div className="mb-2">
            <p
              className="cursor-pointer p-2 font-bold"
              onClick={profile?.viewAllPosts}
            >
              {profile?.data?.posts?.total}{" "}
              {profile?.data?.posts?.total == 1 ? "Post" : "Posts"},{" "}
              {profile?.data?.posts?.replies}{" "}
              {profile?.data?.posts?.replies == 1 ? "Reply" : "Replies"}
            </p>
            <div className="flex justify-between bg-neutral-100 py-2">
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewActivePosts}
                >
                  active
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewSoldPosts}
                >
                  sold
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewInactivePosts}
                >
                  inactive
                </span>
              </p>
              <p>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewActivePosts}
                >
                  {profile?.data?.posts?.active}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewSoldPosts}
                >
                  {profile?.data?.posts?.sold}
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer p-2"
                  onClick={profile?.viewInactivePosts}
                >
                  {profile?.data?.posts?.inactive}
                </span>
              </p>
            </div>
            <p
              className="flex cursor-pointer justify-between p-2"
              onClick={profile?.viewFirstPost}
            >
              <span>first</span>
              <span>{profile?.data?.posts?.first ? format(profile?.data?.posts?.first, "dd/MM/yy") : ""}</span>
            </p>
            <p
              className="flex cursor-pointer justify-between bg-neutral-100 p-2"
              onClick={profile?.viewMostRecentPost}
            >
              <span>most recent</span>
              <span>
                {profile?.data?.posts?.mostRecent ? format(profile?.data?.posts?.mostRecent, "dd/MM/yy") : ""}
              </span>
            </p>
            <p
              className="flex cursor-pointer justify-between p-2"
              onClick={profile?.viewOldestActivePost}
            >
              <span>oldest active</span>
              <span>
                {profile?.data?.posts?.oldestActive ? format(profile?.data?.posts?.oldestActive, "dd/MM/yy") : ""}
              </span>
            </p>
          </div>
        </div>
        <div>
          <p
            className="cursor-pointer px-2 text-lg font-bold"
            onClick={profile?.onBack}
          >
            {"<"}
          </p>
        </div>
      </div>
    </div>
  );
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
};
