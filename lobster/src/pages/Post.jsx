import { useState } from "react";
import { format } from "date-fns";

export const Post = ({ post }) => {
  const [offer, setOffer] = useState("");

  const viewEdits = () => {
    console.log("see edits");
  };

  const onFlag = () => {
    console.log("flag");
  };

  const viewAuthor = () => {
    console.log("author");
  };

  const onPost = (e) => {
    console.log("post");
  };

  const onBack = () => {
    console.log("back");
  };

  const viewOffers = () => {
    console.log("offers");
  };

  const viewLocation = () => {
    console.log("location");
  };

  return (
    <div className="flex min-h-full flex-col justify-between py-2 text-left">
      <div className="px-2">
        <h1 className="mb-2 cursor-pointer text-2xl" onClick={viewAuthor}>
          Incredible Bicycle! 56 Speed! Super fast! Wow!
        </h1>
        <div className="float-left mb-2 mr-2 min-w-full bg-yellow-400 sm:min-w-min">
          <div className="flex h-64 flex-row items-center justify-center sm:w-64">
            <span>image area</span>
          </div>
        </div>
        <div>
          <p>
            <span>{post.description}</span>
            <span className="italic">
              <span> - </span>
              <span className="cursor-pointer italic" onClick={viewAuthor}>
                {post.author.name}
              </span>
              <span>, {format(post.time, "dd/MM/yy")}</span>
              {post.edits.length ? (
                <>
                  <span>, </span>
                  <span onClick={viewEdits} className="cursor-pointer">
                    edited
                  </span>
                </>
              ) : (
                ""
              )}
            </span>
          </p>
        </div>
        <div className="mt-2 flex flex-row items-center justify-between">
          <div>
            <button
              onClick={onFlag}
              className="rounded bg-orange-300 px-2 py-1 hover:bg-orange-900 hover:text-white"
            >
              Flag
            </button>
          </div>
          <div className="text-right">
            <p onClick={viewLocation} className="cursor-pointer">
              {post.location}
            </p>
            <p>{post.price}</p>
          </div>
        </div>
      </div>
      <div>
        <div className="mt-2 px-2">
          <form className="flex flex-row" onSubmit={() => {}}>
            <input
              className="mr-2 grow rounded p-2"
              type="text"
              placeholder="make an offer"
              value={offer}
              onChange={(e) => {
                setOffer(e.target.value);
              }}
            />
            <button
              className={
                "rounded-md border-2 px-4 py-2 " +
                (offer.length
                  ? "border-white bg-emerald-100 hover:bg-emerald-900 hover:text-white"
                  : "border-neutral-400 text-neutral-500")
              }
              type="button"
              onClick={onPost}
              disabled={!offer.length}
            >
              Post
            </button>
          </form>
        </div>
        <div className="mt-2 flex flex-row justify-between leading-6">
          <div className="cursor-pointer px-2" onClick={onBack}>
            <p className="text-lg font-bold">{"<"}</p>
          </div>
          <div className="cursor-pointer px-2" onClick={viewOffers}>
            <p className="relative bottom-0.5 text-sm">
              offers
              <span className="relative top-0.5 pl-1 text-lg font-bold">
                {">"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const fakePost = {
  uuid: "63856492738",
  time: new Date(), // when it was last edited
  title: "Incredible Bicycle! 56 Speed! Super fast! Wow!",
  images: [],
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper mauris augue, vitae sodales odio blandit vel. Curabitur a nisi massa. Nam quis sagittis felis. Nunc feugiat mauris sit amet dolor interdum maximus. Cras semper orci odio, non efficitur arcu aliquet sit amet. In ornare cursus augue. Ut ut sem pulvinar, tincidunt purus vel, convallis velit. Proin fringilla ullamcorper enim et lacinia. Proin mollis dictum ipsum sed faucibus. Fusce laoreet rutrum erat in dapibus. Donec risus tortor, varius ut risus in, aliquam condimentum purus. Nulla euismod eros sed egestas dapibus. Proin eu arcu sed lectus fermentum vestibulum ut ac lorem. Sed id nunc eu neque elementum lobortis. Sed ut nisi facilisis, sodales erat sit amet, ultricies libero.",
  author: {
    id: "765426834098",
    name: "Douglas",
  },
  location: "123 Bender Street",
  price: "$12 CAD",
  edits: [
    {
      draft: false,
      time: new Date(),
    },
    {
      title: "Incredible Bicycle! 56 Speed! Super fast! Wow!",
      images: [],
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper mauris augue, vitae sodales odio blandit vel. Curabitur a nisi massa. Nam quis sagittis felis. Nunc feugiat mauris sit amet dolor interdum maximus. Cras semper orci odio, non efficitur arcu aliquet sit amet. In ornare cursus augue. Ut ut sem pulvinar, tincidunt purus vel, convallis velit. Proin fringilla ullamcorper enim et lacinia. Proin mollis dictum ipsum sed faucibus. Fusce laoreet rutrum erat in dapibus. Donec risus tortor, varius ut risus in, aliquam condimentum purus. Nulla euismod eros sed egestas dapibus. Proin eu arcu sed lectus fermentum vestibulum ut ac lorem. Sed id nunc eu neque elementum lobortis. Sed ut nisi facilisis, sodales erat sit amet, ultricies libero.",
      location: "123 Bender Street",
      price: "$12 CAD",
      draft: true,
      time: new Date(),
    },
  ],
};
