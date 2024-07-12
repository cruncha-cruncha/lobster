import { useState, useEffect, useCallback } from "react";
import { getLastPathSegment, useRouter } from "../../components/router/Router";
import { useAuth } from "../../components/userAuth";
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

  const [title, endpoint] = (() => {
    switch (router.pageKey) {
      case "all-user-posts":
        return [`All Posts (${authorName})`, endpoints.getAllUsersPosts];
      case "active-user-posts":
        return [`Active Posts (${authorName})`, endpoints.getUsersActivePosts];
      case "draft-user-posts":
        return [`Draft Posts (${authorName})`, endpoints.getUsersDraftPosts];
      case "sold-user-posts":
        return [`Sold Posts (${authorName})`, endpoints.getUsersSoldPosts];
      case "deleted-user-posts":
        return [`Deleted Posts (${authorName})`, endpoints.getUsersDeletedPosts];
      default:
        return ["", null];
    }
  })();

  useEffect(() => {
    if (!endpoint) return;
    let mounted = true;

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
            <p>{list?.title}</p>
            {list?.data?.map((post) => (
              <PureSingleListItem
                key={post.uuid}
                post={post}
                goToPost={() => list.goToPost(post.uuid)}
              />
            ))}
          </div>
          <div className="hide-while-sliding flex justify-between">
            <p
              className="cursor-pointer p-2 text-lg font-bold"
              onClick={(e) => list?.onBack?.(e)}
            >
              {"<"}
            </p>
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

export const PureSingleListItem = ({ post, goToPost }) => {
  return (
    <div className="cursor-pointer" onClick={() => goToPost()}>
      <p>title: {post?.title}</p>
      <p>price: {post?.price}</p>
      <p>currency: {post?.currency}</p>
      <p>country: {post?.country}</p>
    </div>
  );
};

export const List = (props) => {
  const list = useList(props);
  return <PureList {...list} />;
};
