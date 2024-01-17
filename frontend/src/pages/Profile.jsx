import { useState, useEffect } from "react";
import { format } from "date-fns";
import { parseDate } from "../api/parseDate";
import { useRouter, getQueryParams } from "../components/router/Router";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

export const formatData = (data) => {
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    rating: 0,
    numRatings: 0,
    country: data.country,
    language: data.language,
    bannedUntil: parseDate(data.banned_until),
    posts: {
      total: data.all_posts,
      active:
        data.all_posts -
        data.draft_posts -
        data.deleted_posts -
        data.sold_posts,
      drafts: data.draft_posts,
      deleted: data.deleted_posts,
      sold: data.sold_posts,
    },
    offers: {
      total: data.all_comments,
      open: data.active_comments, // not sold or deleted
      hit: data.bought_comments, // post was sold to us
      missed: data.missed_comments, // post was sold to someone else
      deleted: data.deleted_comments, // comment was deleted
      lost: data.lost_comments, // post was deleted
    },
  };
};

export const formatHistory = (data) => {
  if (!data) return null;

  return {
    oldestPost: {
      uuid: data.oldest_post_uuid,
      date: parseDate(data.oldest_post_date),
    },
    newestPost: {
      uuid: data.newest_post_uuid,
      date: parseDate(data.newest_post_date),
    },
    oldestComment: {
      uuid: data.oldest_comment_uuid,
      date: parseDate(data.oldest_comment_date),
    },
    newestComment: {
      uuid: data.newest_comment_uuid,
      date: parseDate(data.newest_comment_date),
    },
  };
};

export const useProfile = () => {
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});
  const [unreadActivity, setUnreadActivity] = useState({});
  const router = useRouter();
  const auth = useAuth();

  const queryParams = getQueryParams();
  const userId = queryParams.get("userId");

  useEffect(() => {
    let mounted = true;

    endpoints
      .getProfile({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200) {
          mounted && setData(formatData(res.data));
        }
      });

    endpoints
      .getProfileHistory({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200) {
          mounted && setHistory(formatHistory(res.data));
        }
      });

    endpoints
      .getUnreadActivity({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200) {
          mounted && setUnreadActivity(res.data);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isMyProfile = auth.user.userId != null && userId == auth.user.userId;

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

  const viewDraftPosts = () => {
    console.log("draft posts");
  };

  const viewFirstPost = () => {
    console.log("first post");
  };

  const viewMostRecentPost = () => {
    console.log("most recent post");
  };

  const onNewPost = () => {
    router.goToWithBack("/new-post", "forward", "right");
  };

  const onSearch = () => {
    router.goTo("/search", "down");
  };

  const onAccount = () => {
    router.goTo(`/account?userId=${userId}`, "up");
  };

  return {
    data,
    history,
    unreadActivity,
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
    onNewPost,
    onSearch,
    onAccount,
    canMakeNewPost: isMyProfile,
    canGoToAccount: isMyProfile,
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
            <p className="text-sm">{profile?.data?.country}</p>
          </div>
          <div className="p-2">
            <p
              className={
                "border-b-2 border-stone-400 p-2 font-bold" +
                (profile?.data?.offers?.total > 0 ? " cursor-pointer" : "")
              }
              onClick={(e) => profile?.viewAllOffers?.(e)}
            >
              {profile?.data?.offers?.total}{" "}
              {profile?.data?.offers?.total == 1 ? "Offer" : "Offers"}
            </p>
            <div className="flex justify-between border-b-2 border-stone-200 py-2">
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.open > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewOpenOffers?.(e)}
                >
                  open
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.hit > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewHitOffers?.(e)}
                >
                  hit
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.missed > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewMissedOffers?.(e)}
                >
                  missed
                </span>
              </p>
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.open > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewOpenOffers?.(e)}
                >
                  {profile?.data?.offers?.open}
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.hit > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewHitOffers?.(e)}
                >
                  {profile?.data?.offers?.hit}
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.missed > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewMissedOffers?.(e)}
                >
                  {profile?.data?.offers?.missed}
                </span>
              </p>
            </div>
            <p
              className={
                "flex justify-between border-b-2 border-stone-200 p-2" +
                (!profile?.history?.oldestComment?.uuid
                  ? ""
                  : " cursor-pointer")
              }
              onClick={(e) => profile?.viewFirstComment?.(e)}
            >
              <span>first</span>
              <span>
                {profile?.history?.oldestComment?.uuid
                  ? format(profile?.history?.oldestComment?.date, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p
              className={
                "flex justify-between border-b-2 border-stone-200 p-2" +
                (!profile?.history?.newestComment?.uuid
                  ? ""
                  : " cursor-pointer")
              }
              onClick={(e) => profile?.viewMostRecentComment?.(e)}
            >
              <span>most recent</span>
              <span>
                {profile?.history?.newestComment?.uuid
                  ? format(profile?.history?.newestComment?.date, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <div className="flex justify-between border-b-2 border-stone-200 py-2">
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.lost > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewLostOffers?.(e)}
                >
                  lost
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.deleted > 0
                      ? " cursor-pointer"
                      : "")
                  }
                  onClick={(e) => profile?.viewDeletedOffers?.(e)}
                >
                  deleted
                </span>
              </p>
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.lost > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewLostOffers?.(e)}
                >
                  {profile?.data?.offers?.lost}
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.offers?.deleted > 0
                      ? " cursor-pointer"
                      : "")
                  }
                  onClick={(e) => profile?.viewDeletedOffers?.(e)}
                >
                  {profile?.data?.offers?.deleted}
                </span>
              </p>
            </div>
          </div>
          <div className="p-2">
            <p
              className={
                "border-b-2 border-stone-400 p-2 font-bold" +
                (profile?.data?.posts?.total > 0 ? " cursor-pointer" : "")
              }
              onClick={(e) => profile?.viewAllPosts?.(e)}
            >
              {profile?.data?.posts?.total}{" "}
              {profile?.data?.posts?.total == 1 ? "Post" : "Posts"}
            </p>
            <div className="flex justify-between border-b-2 border-stone-200 py-2">
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.active > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewActivePosts?.(e)}
                >
                  active
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.drafts > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewDraftPosts?.(e)}
                >
                  drafts
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.sold > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewSoldPosts?.(e)}
                >
                  sold
                </span>
              </p>
              <p>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.active > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewActivePosts?.(e)}
                >
                  {profile?.data?.posts?.active}
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.drafts > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewDraftPosts?.(e)}
                >
                  {profile?.data?.posts?.drafts}
                </span>
                <span>/</span>
                <span
                  className={
                    "p-2" +
                    (profile?.data?.posts?.sold > 0 ? " cursor-pointer" : "")
                  }
                  onClick={(e) => profile?.viewSoldPosts?.(e)}
                >
                  {profile?.data?.posts?.sold}
                </span>
              </p>
            </div>
            <p
              className={
                "flex justify-between border-b-2 border-stone-200 p-2" +
                (!profile?.history?.oldestPost?.uuid ? "" : " cursor-pointer")
              }
              onClick={(e) => profile?.viewFirstPost?.(e)}
            >
              <span>first</span>
              <span>
                {profile?.history?.oldestPost?.uuid
                  ? format(profile?.history?.oldestPost?.date, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p
              className={
                "flex justify-between border-b-2 border-stone-200 p-2" +
                (!profile?.history?.newestPost?.uuid ? "" : " cursor-pointer")
              }
              onClick={(e) => profile?.viewMostRecentPost?.(e)}
            >
              <span>most recent</span>
              <span>
                {profile?.history?.newestPost?.uuid
                  ? format(profile?.history?.newestPost?.date, "dd/MM/yy")
                  : ""}
              </span>
            </p>
            <p className="flex justify-between border-b-2 border-stone-200 p-2">
              <span>deleted</span>
              <span>{profile?.data?.posts?.deleted}</span>
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-x-2 pr-2">
          {profile?.canGoToAccount && (
            <button
              className="rounded-full bg-sky-200 px-4 py-2 transition-colors hover:bg-sky-900 hover:text-white"
              onClick={(e) => profile?.onAccount?.(e)}
            >
              Account
            </button>
          )}
          {profile?.canMakeNewPost && (
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 transition-colors hover:bg-emerald-900 hover:text-white"
              onClick={(e) => profile?.onNewPost?.(e)}
            >
              New
            </button>
          )}
          <button
            className="rounded-full bg-emerald-200 px-4 py-2 transition-colors hover:bg-emerald-900 hover:text-white"
            onClick={(e) => profile?.onSearch?.(e)}
          >
            Search
          </button>
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
  country: "Canada",
  language: "english",
  posts: {
    total: 5,
    active: 2,
    drafts: 1,
    deleted: 1,
    sold: 2,
    first: new Date(),
    mostRecent: new Date(),
  },
  offers: {
    total: 3,
    open: 1,
    hit: 1,
    missed: 1,
    lost: 1,
    first: new Date(),
    mostRecent: new Date(),
  },
};
