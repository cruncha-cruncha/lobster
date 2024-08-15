import { PureSearchForm, useSearch, GET_PAGE_SIZE } from "./Search";
import { useCurrencies } from "../../components/useCurrencies";
import { useRouter } from "../../components/router/Router";
import { useAuth } from "../../components/userAuth";
import { PureInfoModal } from "../../components/InfoModal";

export const useResults = () => {
  const router = useRouter();
  const auth = useAuth();
  const search = useSearch();

  const onNext = () => {
    const newPage = search.page + 1;
    search.setPage(newPage);
    search.onSearch(newPage);
  };

  const onPrev = () => {
    if (search.page === 0) return;
    const newPage = search.page - 1;
    search.setPage(newPage);
    search.onSearch(newPage);
  };

  const goToPost = (uuid) => {
    router.goTo(`/post/${uuid}`, "left");
  };

  const goToMyProfile = () => {
    router.goTo(`/profile/${auth.user.userId}`, "up");
  };

  return {
    search,
    hasPrev: search.page > 0,
    hasNext: search.results.length >= GET_PAGE_SIZE(),
    searchDisabled: search.isLoading || search.term === "",
    onNext,
    onPrev,
    goToPost,
    goToMyProfile,
  };
};

export const PureResults = (results) => {
  return (
    <>
      <PureInfoModal {...results?.search?.modal} />
      <div className="flex min-h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between py-2">
          <div>
            <PureSearchForm {...results?.search} />
            <div>
              {results?.search?.results?.map((post) => (
                <PureSingleResult
                  key={post?.uuid}
                  post={post}
                  goToPost={() => results?.goToPost(post?.uuid)}
                />
              ))}
            </div>
          </div>
          <div className="hide-while-sliding flex justify-end gap-x-2 pr-2">
            <button
              className={
                "rounded-full bg-emerald-200 px-4 py-2 hover:text-white" +
                (results?.hasPrev
                  ? " bg-emerald-200 hover:bg-emerald-900"
                  : " bg-stone-300 text-white")
              }
              onClick={(e) => results?.onPrev?.(e)}
              disabled={!results?.hasPrev}
            >
              Prev
            </button>
            <button
              className="rounded-full bg-sky-200 px-4 py-2 hover:bg-sky-900 hover:text-white"
              onClick={(e) => results?.goToMyProfile?.(e)}
            >
              Profile
            </button>
            <button
              className={
                "rounded-full px-4 py-2 transition-colors hover:text-white" +
                (results?.searchDisabled
                  ? " bg-stone-300 text-white"
                  : " bg-emerald-200 hover:bg-emerald-900")
              }
              onClick={(e) => results?.search?.onSearch?.(e)}
              disabled={results?.searchDisabled}
            >
              Search
            </button>
            <button
              className={
                "rounded-full px-4 py-2 hover:text-white" +
                (results?.hasNext
                  ? " bg-emerald-200 hover:bg-emerald-900"
                  : " bg-stone-300 text-white")
              }
              onClick={(e) => results?.onNext?.(e)}
              disabled={!results?.hasNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const PureSingleResult = ({ post, goToPost }) => {
  const { currencies } = useCurrencies();
  const currencySymbol = currencies.find(
    (c) => c.id === post?.currency,
  )?.symbol;

  return (
    <div className="m-2 cursor-pointer" onClick={() => goToPost()}>
      <div className="flex">
        <div className="mr-2 h-20 w-20 shrink-0 grow-0 basis-20 bg-pink-500"></div>
        <div>
          <p className="text-lg">{post?.title}</p>
          <p>
            {post?.price} {currencySymbol}, {post?.authorName}
          </p>
          <p>
            {post?.latitude}, {post?.longitude} (aka how far away)
          </p>
          <p>
            {post?.commentCount}{" "}
            {post?.commentCount == 1 ? "comment" : "comments"}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Results = (props) => {
  const results = useResults(props);
  return <PureResults {...results} />;
};
