import { PureSearchForm, useSearch, GET_PAGE_SIZE } from "./Search";
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
  return (
    <div className="cursor-pointer" onClick={() => goToPost()}>
      <p>title: {post?.title}</p>
      <p>price: {post?.price}</p>
      <p>currency: {post?.currency}</p>
      <p>comment count: {post?.commentCount}</p>
      <p>author id: {post?.authorId}</p>
      <p>author name: {post?.authorName}</p>
      <p>country: {post?.country}</p>
    </div>
  );
};

export const Results = (props) => {
  const results = useResults(props);
  return <PureResults {...results} />;
};
