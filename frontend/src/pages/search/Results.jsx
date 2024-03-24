import { useState, useEffect, useMemo } from "react";
import { PureSearchForm, useSearch } from "./Search";
import { useRouter } from "../../components/router/Router";
import { useAuth } from "../../components/userAuth";
import * as endpoints from "../../api/endpoints";
import { useInfoModal, PureInfoModal } from "../../components/InfoModal";
import { LRU } from "./LRU";

export const useResults = () => {
  const router = useRouter();
  const auth = useAuth();
  const search = useSearch();
  const modal = useInfoModal();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const nameCache = useMemo(() => new LRU(1000), []);

  const onSearch = (page) => {
    setCollapsed(true);

    const onErr = () => {
      setCollapsed(false);
      modal.open("Search failed. Please try again later.", "error");
    };

    const numPage = Number(page);
    const offset = !isNaN(numPage) ? numPage * 20 : search.page * 20;

    endpoints
      .searchPosts({
        accessToken: auth.accessToken,
        data: {
          full: true,
          offset,
          limit: 20,
          sort_by: search.sort,
          term: search.term,
          countries: search.countries,
          location: {
            valid: search.location.on,
            latitude: search.location.latitude,
            longitude: search.location.longitude,
            radius: search.location.radius,
          },
          no_price: {
            only: search.noPrice.only,
            exclude: search.noPrice.exclude,
          },
          price_range: {
            valid: search.priceRange.on,
            min: search.priceRange.low,
            max: search.priceRange.high,
          },
        },
      })
      .then((res) => {
        if (res.status === 200) {
          const found = res.data.found;
          const authorIds = found.map((post) => post.author_id);
          kickAuthors(authorIds);
          setData(found);
        } else {
          console.error(res.status, res);
          onErr();
        }
      })
      .catch((e) => {
        console.error(e);
        onErr();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const kickAuthors = (ids) => {
    endpoints
      .getPeople({
        accessToken: auth.accessToken,
        data: {
          ids,
        },
      })
      .then((res) => {
        if (res.status === 200) {
          res.data.people.forEach((person) => {
            nameCache.put(person.id, person.name);
          });

          setData((prev) =>
            prev.map((post) => ({
              ...post,
              author_name: nameCache.get(post.author_id),
            })),
          );
        } else {
          console.error(res.status, res);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onNext = () => {
    const newPage = search.page + 1;
    search.setPage(newPage);
    onSearch(newPage);
  };

  const onPrev = () => {
    if (search.page === 0) return;
    const newPage = search.page - 1;
    search.setPage(newPage);
    onSearch(newPage);
  };

  const goToPost = (uuid) => {
    router.goToWithBack(`/post/${uuid}` + window.location.search, "left");
  };

  const goToMyProfile = () => {
    router.goTo(`/profile/${auth.user.userId}`, "up");
  };

  return {
    search,
    collapsed,
    isLoading,
    data,
    modal,
    getName: nameCache.get,
    onSearch,
    hasPrev: search.page > 0,
    onNext,
    onPrev,
    goToPost,
    goToMyProfile,
  };
};

export const PureResults = (results) => {
  return (
    <>
      <PureInfoModal {...results?.modal} />
      <div className="flex min-h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between py-2">
          <div className={"flex flex-col justify-center"}>
            <PureSearchForm {...results?.search} />
          </div>
          <div>
            {results.data.map((post) => (
              <PureSingleResult
                key={post?.uuid}
                post={post}
                goToPost={() => results?.goToPost(post?.uuid)}
              />
            ))}
          </div>
          <div className="flex justify-end gap-x-2 pr-2">
            {results.hasPrev && (
              <button
                className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white"
                onClick={(e) => results?.onPrev?.(e)}
              >
                Prev
              </button>
            )}
            <button
              className="rounded-full bg-sky-200 px-4 py-2 hover:bg-sky-900 hover:text-white"
              onClick={(e) => results?.goToMyProfile?.(e)}
            >
              Profile
            </button>
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white"
              onClick={(e) => results?.onSearch?.(e)}
            >
              Search
            </button>
            <button
              className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white"
              onClick={(e) => results?.onNext?.(e)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const PureSingleResult = ({ post, goToPost }) => {
  return (
    <div className="cursor-pointer" onClick={() => goToPost()}>
      <p>title: {post?.title}</p>
      <p>price: {post?.price}</p>
      <p>currency: {post?.currency}</p>
      <p>comment count: {post?.comment_count}</p>
      <p>author id: {post?.author_id}</p>
      <p>author name: {post?.author_name}</p>
      <p>country: {post?.country}</p>
    </div>
  );
};

export const Results = (props) => {
  const results = useResults(props);
  return <PureResults {...results} />;
};
