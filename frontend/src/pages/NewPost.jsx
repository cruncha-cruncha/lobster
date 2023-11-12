import { PureEditPostContent } from "./EditPost";
import { useRouter } from "../components/router/Router";

export const useNewPost = () => {
  const router = useRouter();

  const onBack = () => {
    router.goTo("/profile", "back");
  };

  const onPublish = () => {
    router.goTo("/post", "back");
  }

  return {
    onBack,
    canPublish: true,
    canDraft: true,
    onPublish,
  };
};

export const PureNewPost = (newPost) => {
  return (
    <>
      <div className="flex h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between pb-2 pt-5">
          <div>
            <PureNewPostTitle {...newPost} />
            <PureEditPostContent {...newPost} />
          </div>
          <PureNewPostFooter {...newPost} />
        </div>
      </div>
    </>
  );
};

export const PureNewPostTitle = () => {
  return <h1 className="mb-2 text-center text-lg">New Post</h1>;
};

export const PureNewPostFooter = (newPost) => {
  return (
    <div className="flex justify-between">
      <p
        className="hide-while-sliding cursor-pointer p-2 text-lg font-bold"
        onClick={(e) => newPost?.onBack?.(e)}
      >
        {"<"}
      </p>
      <div className="flex">
        <button
          className={
            "ml-2 rounded-full px-4 py-2 transition-colors" +
            (newPost?.canDraft
              ? " bg-sky-200 hover:bg-sky-900 hover:text-white"
              : " bg-stone-300 text-white")
          }
          onClick={(e) => newPost?.onDraft?.(e)}
          disabled={!newPost?.canDraft}
        >
          Draft
        </button>
        <button
          className={
            "ml-2 rounded-full px-4 py-2 transition-colors" +
            (newPost?.canPublish
              ? " bg-emerald-200 hover:bg-emerald-900 hover:text-white"
              : " bg-stone-300 text-white")
          }
          onClick={(e) => newPost?.onPublish?.(e)}
          disabled={!newPost?.canPublish}
        >
          Publish
        </button>
      </div>
    </div>
  );
};

export const NewPost = (props) => {
  const newPost = useNewPost(props);
  return <PureNewPost {...newPost} />;
};

export const fakeData = {};
