import { useState, useEffect } from "react";
import {
  getLastPathSegment,
  useRouter,
  getPageKeyFromWindow,
} from "../../components/router/Router";
import { useAuth } from "../../components/userAuth";
import { useCurrencies } from "../../components/useCurrencies";
import * as endpoints from "../../api/endpoints";

// page size is set in the backend and can't be changed
export const GET_PAGE_SIZE = () => 20;

export const formatData = ({ data, author_name }) => {
  if (!data) return null;

  return {
    uuid: data.uuid,
    authorId: data.author_id,
    authorName: author_name,
    title: data.title,
    content: data.content,
    images: data.images,
    price: data.price,
    currency: data.currency,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
    sold: data.sold,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const useList = () => {
  const [page, setPage] = useState(0);
  const [data, setData] = useState([]);
  const [authorName, setAuthorName] = useState("");
  const router = useRouter();
  const auth = useAuth();

  const userId = getLastPathSegment(router.path);
  const pageKey = getPageKeyFromWindow();

  const [title, endpoint] = (() => {
    switch (pageKey) {
      case "all-user-posts":
        return [`All Posts (${authorName})`, endpoints.getAllUsersPosts];
      case "active-user-posts":
        return [`Active Posts (${authorName})`, endpoints.getUsersActivePosts];
      case "draft-user-posts":
        return [`Draft Posts (${authorName})`, endpoints.getUsersDraftPosts];
      case "sold-user-posts":
        return [`Sold Posts (${authorName})`, endpoints.getUsersSoldPosts];
      case "deleted-user-posts":
        return [
          `Deleted Posts (${authorName})`,
          endpoints.getUsersDeletedPosts,
        ];
      case "all-user-offers":
        return [`All Offers (${authorName})`, endpoints.getAllUsersComments];
      case "open-user-offers":
        return [
          `Open Offers (${authorName})`,
          endpoints.getUsersOpenComments,
        ];
      case "hit-user-offers":
        return [`Hit Offers (${authorName})`, endpoints.getUsersHitComments];
      case "deleted-user-offers":
        return [
          `Deleted Offers (${authorName})`,
          endpoints.getUsersDeletedComments,
        ];
      case "missed-user-offers":
        return [
          `Missed Offers (${authorName})`,
          endpoints.getUsersMissedComments,
        ];
      case "lost-user-offers":
        return [
          `Lost Offers (${authorName})`,
          endpoints.getUsersLostComments,
        ];
      default:
        return ["Posts", null];
    }
  })();

  useEffect(() => {
    let mounted = true;
    if (!endpoint) return;

    endpoint({
      userId: userId,
      accessToken: auth.accessToken,
      page: page,
    }).then((res) => {
      if (res.status === 200 && mounted) {
        setData(
          res.data.posts.map((p) =>
            formatData({
              data: p,
              author_name: res.data.author_name,
            }),
          ),
        );
        setAuthorName(res.data.author_name);
      }
    });

    return () => {
      mounted = false;
    };
  }, [endpoint, userId, auth.accessToken, page]);

  const onNext = () => {
    setPage((prev) => prev + 1);
  };

  const onPrev = () => {
    setPage((prev) => {
      if (prev <= 0) {
        return 0;
      } else {
        return prev - 1;
      }
    });
  };

  const goToPost = (uuid) => {
    router.goTo(`/post/${uuid}`, "left");
  };

  const onBack = () => {
    if (router.canGoBack) {
      router.goBack();
    } else {
      router.goTo(`/profile/${userId}`, "right");
    }
  };

  return {
    data,
    title,
    hasPrev: page > 0,
    hasNext: data.length >= GET_PAGE_SIZE(),
    markSold: pageKey === "all-user-posts",
    markDeleted: pageKey === "all-user-posts",
    onNext,
    onPrev,
    goToPost,
    onBack,
  };
};

export const PureList = (list) => {
  return (
    <>
      <div className="flex min-h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between py-2">
          <div>
            <p className="mb-2 text-center text-xl">{list?.title}</p>
            {list?.data?.map((post) => (
              <PureSingleListItem
                key={post?.uuid}
                post={post}
                goToPost={() => list?.goToPost?.(post?.uuid)}
                markSold={list?.showSold}
                markDeleted={list?.markDeleted}
              />
            ))}
          </div>
          <div className="hide-while-sliding flex justify-between">
            <button
              className="relative ml-2 cursor-pointer px-4 py-4"
              onClick={(e) => list?.onBack?.(e)}
            >
              <p className="absolute left-0 right-0 -translate-y-1/2 text-lg font-bold">
                {"<"}
              </p>
            </button>
            <div className="flex gap-x-2 pr-2">
              <button
                className={
                  "rounded-full bg-emerald-200 px-4 py-2 hover:text-white" +
                  (list?.hasPrev
                    ? " bg-emerald-200 hover:bg-emerald-900"
                    : " bg-stone-300 text-white")
                }
                onClick={(e) => list?.onPrev?.(e)}
                disabled={!list?.hasPrev}
              >
                Prev
              </button>
              <button
                className={
                  "rounded-full px-4 py-2 hover:text-white" +
                  (list?.hasNext
                    ? " bg-emerald-200 hover:bg-emerald-900"
                    : " bg-stone-300 text-white")
                }
                onClick={(e) => list?.onNext?.(e)}
                disabled={!list?.hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const PureSingleListItem = ({
  post,
  goToPost,
  markSold,
  markDeleted,
}) => {
  const { currencies } = useCurrencies();
  const currencySymbol = currencies.find(
    (c) => c.id === post?.currency,
  )?.symbol;

  const status = () => {
    if ((markDeleted || markSold) && post?.deleted) {
      return "Deleted";
    } else if (markSold && post?.sold) {
      return "Sold";
    } else {
      return "";
    }
  };

  return (
    <div className="m-2 cursor-pointer" onClick={() => goToPost()}>
      <div className="flex">
        <div className="mr-2 h-20 w-20 shrink-0 grow-0 basis-20 bg-pink-500"></div>
        <div>
          <p className="mb-1 text-lg">{post?.title}</p>
          <p className="mb-1">
            {post?.price} {currencySymbol}
          </p>
          <p className="mb-1">
            {post?.latitude}, {post?.longitude} (aka how far away)
          </p>
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
};

export const List = (props) => {
  const list = useList(props);
  return <PureList {...list} />;
};
