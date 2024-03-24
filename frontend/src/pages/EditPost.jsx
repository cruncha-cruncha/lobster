import { useRouter } from "../components/router/Router";

export const useEditPost = () => {
  const router = useRouter();

  const onDraft = () => {
    router.goTo("/post", "back");
  };

  return {
    isDraft: false,
    canPublish: true,
    canSave: true,
    canDraft: true,
    onDelete: () => {},
    onPublish: () => {},
    onSave: () => {},
    onDraft,
    onImages: () => {},
    onBack: () => {},
    onLocation: () => {},
  };
};

export const PureEditPost = (editPost) => {
  return (
    <>
      <div className="flex min-h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between pb-2 pt-5">
          <div>
            <PureEditPostTitle {...editPost} />
            <PureEditPostContent {...editPost} />
          </div>
          <PureEditPostFooter {...editPost} />
        </div>
      </div>
    </>
  );
};

export const PureEditPostTitle = () => {
  return <h1 className="mb-2 text-center text-lg">Edit Post</h1>;
};

export const PureEditPostContent = (editPost) => {
  // images flow:
  // if no images: select
  // if some images: edit, add
  // if editing: reorder, delete

  return (
    <div>
      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-end">
          <label
            htmlFor="title"
            className="my-2 border-b-2 border-transparent py-1"
          >
            Title
          </label>
        </div>
        <div className="m-2 grow rounded-sm border-b-2 border-stone-800">
          <input
            type="text"
            id="title"
            placeholder="Title"
            value={editPost?.title}
            onChange={(e) => editPost?.setTitle?.(e)}
            className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
          />
        </div>
      </div>

      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-end">
          <label
            htmlFor="description"
            className="my-2 border-b-2 border-transparent py-1"
          >
            Description
          </label>
        </div>
        <div className="m-2 grow rounded-sm border-b-2 border-stone-800">
          <textarea
            id="description"
            placeholder="Description"
            value={editPost?.description}
            onChange={(e) => editPost?.setDescription?.(e)}
            className="w-full rounded-sm px-2 py-1 align-top ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
            rows={5}
          />
        </div>
      </div>

      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-end">
          <label
            htmlFor="images"
            className="my-2 border-b-2 border-transparent py-1"
          >
            Images
          </label>
        </div>
        <div className="m-2 grow">
          <button className="rounded-full bg-sky-200 px-4 py-1 hover:bg-sky-900 hover:text-white">
            Select
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-end">
          <label
            htmlFor="location"
            className="my-2 border-b-2 border-transparent py-1"
          >
            Location
          </label>
        </div>
        <div className="m-2 grow">
          <button className="rounded-full bg-sky-200 px-4 py-1 hover:bg-sky-900 hover:text-white">
            Select
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-end">
          <label
            htmlFor="price"
            className="my-2 border-b-2 border-transparent py-1"
          >
            Price
          </label>
        </div>
        <div className="m-2 grow rounded-sm border-b-2 border-stone-800">
          <input
            type="text"
            id="price"
            placeholder="Price"
            value={editPost?.price}
            onChange={(e) => editPost?.setPrice?.(e)}
            className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
          />
        </div>
        <select
          className={
            "m-2 grow rounded-sm border-b-2 border-stone-800 bg-white px-2 py-1" +
            (editPost?.currency != "0" ? "" : " text-stone-400")
          }
          value={editPost?.currency}
          onChange={(e) => editPost?.setCurrency?.(e)}
          id="currency"
        >
          <option value="0" disabled className="placeholder">
            Currency
          </option>
          {(editPost?.currencyOptions || []).map((currency) => (
            <option key={currency?.value} value={currency?.value}>
              {currency?.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const PureEditPostFooter = (editPost) => {
  const draftButtonDisabled = editPost?.isDraft
    ? !editPost?.canSave
    : !editPost?.canDraft;
  const draftButtonAction = editPost?.isDraft
    ? editPost?.onSave
    : editPost?.onDraft;
  const publishButtonDisabled = editPost?.isDraft
    ? !editPost?.canPublish
    : !editPost?.canSave;
  const publishButtonAction = editPost?.isDraft
    ? editPost?.onPublish
    : editPost?.onSave;

  return (
    <div className="flex justify-between">
      <p
        className="hide-while-sliding cursor-pointer p-2 text-lg font-bold"
        onClick={(e) => editPost?.onBack?.(e)}
      >
        {"<"}
      </p>
      <div className="flex">
        <button
          className="rounded-full bg-orange-200 px-4 py-1 hover:bg-orange-900 hover:text-white"
          onClick={(e) => editPost?.onDelete?.(e)}
        >
          Delete
        </button>
        <button
          className={
            "ml-2 rounded-full px-4 py-2 transition-colors" +
            (!draftButtonDisabled
              ? " bg-sky-200 hover:bg-sky-900 hover:text-white"
              : " bg-stone-300 text-white")
          }
          onClick={(e) => draftButtonAction?.(e)}
          disabled={draftButtonDisabled}
        >
          {editPost?.isDraft ? "Save" : "Draft"}
        </button>
        <button
          className={
            "ml-2 rounded-full px-4 py-2 transition-colors" +
            (!publishButtonDisabled
              ? " bg-emerald-200 hover:bg-emerald-900 hover:text-white"
              : " bg-stone-300 text-white")
          }
          onClick={(e) => publishButtonAction?.(e)}
          disabled={publishButtonDisabled}
        >
          {editPost?.isDraft ? "Publish" : "Save"}
        </button>
      </div>
    </div>
  );
};

export const EditPost = (props) => {
  const editPost = useEditPost(props);
  return <PureEditPost {...editPost} />;
};
