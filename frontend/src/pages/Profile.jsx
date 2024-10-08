import { useState, useEffect } from "react";
import { format } from "date-fns";
import { parseDate } from "../api/parseDate";
import { useRouter, getLastPathSegment } from "../components/router/Router";
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

  const userId = getLastPathSegment();

  useEffect(() => {
    let mounted = true;

    endpoints
      .getProfile({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200 && mounted) {
          setData(formatData(res.data));
        }
      });

    endpoints
      .getProfileHistory({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200 && mounted) {
          setHistory(formatHistory(res.data));
        }
      });

    endpoints
      .getUnreadActivity({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200 && mounted) {
          setUnreadActivity(res.data);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId, auth.accessToken]);

  const isMyProfile = auth.user.userId != null && userId == auth.user.userId;

  const viewRatings = () => {
    console.log("ratings");
  };

  const viewAllOffers = () => {
    router.goTo(`/all-user-offers/${userId}`, "left");
  };

  const viewOpenOffers = () => {
    router.goTo(`/open-user-offers/${userId}`, "left");
  };

  const viewHitOffers = () => {
    router.goTo(`/hit-user-offers/${userId}`, "left");
  };

  const viewMissedOffers = () => {
    router.goTo(`/missed-user-offers/${userId}`, "left");
  };

  const viewLostOffers = () => {
    router.goTo(`/lost-user-offers/${userId}`, "left");
  };

  const viewDeletedOffers = () => {
    router.goTo(`/deleted-user-offers/${userId}`, "left");
  };

  const viewFirstOffer = () => {
    router.goTo(`/comments/${history.oldestComment.uuid}`, "left");
  };

  const viewMostRecentOffer = () => {
    router.goTo(`/comments/${history.newestComment.uuid}`, "left");
  };

  const viewAllPosts = () => {
    router.goTo(`/all-user-posts/${userId}`, "left");
  };

  const viewActivePosts = () => {
    router.goTo(`/active-user-posts/${userId}`, "left");
  };

  const viewSoldPosts = () => {
    router.goTo(`/sold-user-posts/${userId}`, "left");
  };

  const viewDraftPosts = () => {
    router.goTo(`/draft-user-posts/${userId}`, "left");
  };

  const viewFirstPost = () => {
    router.goTo(`/post/${history.oldestPost.uuid}`, "left");
  };

  const viewMostRecentPost = () => {
    router.goTo(`/post/${history.newestPost.uuid}`, "left");
  };

  const viewDeletedPosts = () => {
    router.goTo(`/deleted-user-posts/${userId}`, "left");
  };

  const onNewPost = () => {
    router.goTo("/new-post", "forward");
  };

  const onSearch = () => {
    router.goTo("/search", "down");
  };

  const onAccount = () => {
    router.goTo(`/account/${userId}`, "up");
  };

  const canGoBack = ["post", "comments"].includes(router.prevPage);

  const onBack = () => {
    router.goBack();
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
    viewLostOffers,
    viewDeletedOffers,
    viewFirstOffer,
    viewMostRecentOffer,
    viewAllPosts,
    viewActivePosts,
    viewSoldPosts,
    viewDraftPosts,
    viewFirstPost,
    viewMostRecentPost,
    viewDeletedPosts,
    onNewPost,
    onSearch,
    onAccount,
    onBack,
    canMakeNewPost: isMyProfile,
    canGoToAccount: isMyProfile,
    canGoBack,
  };
};

export const PureProfile = (profile) => {
  return (
    <div className="flex min-h-full justify-center">
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
              onClick={(e) => profile?.viewFirstOffer?.(e)}
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
              onClick={(e) => profile?.viewMostRecentOffer?.(e)}
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
            <p
              className={
                "flex justify-between border-b-2 border-stone-200 p-2" +
                (profile?.data?.posts?.deleted?.length > 0
                  ? " cursor-pointer"
                  : "")
              }
              onClick={(e) => profile?.viewDeletedPosts?.(e)}
            >
              <span>deleted</span>
              <span>{profile?.data?.posts?.deleted}</span>
            </p>
          </div>
        </div>
        <div className="hide-while-sliding flex flex-row justify-between">
          {profile?.canGoBack && (
            <button
              className="relative ml-2 cursor-pointer px-4 py-4"
              onClick={(e) => profile?.onBack?.(e)}
            >
              <p className="absolute left-0 right-0 -translate-y-1/2 text-lg font-bold">
                {"<"}
              </p>
            </button>
          )}
          <div className="flex grow justify-end gap-x-2 pr-2">
            {profile?.canGoToAccount && (
              <button
                className="rounded-full bg-sky-200 px-4 py-2 transition-colors hover:bg-sky-900 hover:text-white"
                onClick={(e) => profile?.onAccount?.(e)}
              >
                Account
              </button>
            )}
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-sky-900 hover:text-white"
              onClick={(e) => profile?.onSearch?.(e)}
            >
              Search
            </button>
            {profile?.canMakeNewPost && (
              <button
                className="rounded-full bg-emerald-200 px-4 py-2 transition-colors hover:bg-emerald-900 hover:text-white"
                onClick={(e) => profile?.onNewPost?.(e)}
              >
                New
              </button>
            )}
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
