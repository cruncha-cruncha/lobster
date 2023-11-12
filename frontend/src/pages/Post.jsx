import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "../components/router/Router";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

export const usePost = () => {
  const router = useRouter();
  const auth = useAuth();
  const [data, setData] = useState(fakeData);
  const [offer, setOffer] = useState("");
  const uuid = router?.urlParams?.get?.("uuid");

  // useEffect(() => {
  //   endpoints
  //     .getPost({
  //       postUuid: uuid,
  //       accessToken: auth.accessToken,
  //     })
  //     .then((res) => console.log("GOT RESPONSE!!", res, data))
  //     .catch(() => console.log("ERROR"));
  // }, []);

  const viewEdits = () => {
    console.log("see edits");
  };

  const onFlag = () => {
    console.log("flag");
  };

  const viewAuthor = () => {
    console.log("author");
  };

  const onOffer = () => {
    console.log("offer");
  };

  const viewOffers = () => {
    //if (!uuid) return;
    router.goTo("/comments?uuid=" + uuid, "left");
  };

  const viewLocation = () => {
    console.log("location");
  };

  const onBack = () => {
    if (router.canGoBack) {
      router.goBack("right");
    } else {
      router.goTo("/search", "right");
    }
  };

  return {
    data,
    offer,
    setOffer,
    canMakeOffer: true,
    isDraft: false,
    onOffer,
    viewEdits,
    onFlag,
    viewAuthor,
    onBack,
    viewOffers,
    viewLocation,
  };
};

export const PurePost = (post) => {
  return (
    <div className="flex h-full justify-center">
      <div className="flex max-w-3xl flex-col justify-between text-left">
        <div className="p-2">
          <h1
            className="mb-2 cursor-pointer text-2xl"
            onClick={(e) => post?.viewAuthor?.(e)}
          >
            Incredible Bicycle! 56 Speed! Super fast! Wow!
          </h1>
          <div className="float-left mb-2 mr-2 min-w-full bg-yellow-400 sm:min-w-min">
            <div className="flex h-64 flex-row items-center justify-center sm:w-64">
              <span>image area</span>
            </div>
          </div>
          <div>
            <p>
              <span>{post?.data?.description}</span>
              <span className="italic">
                <span> - </span>
                <span
                  className="cursor-pointer italic"
                  onClick={(e) => post?.viewAuthor?.(e)}
                >
                  {post?.data?.author?.name}
                </span>
                <span>
                  ,{" "}
                  {post?.data?.time ? format(post?.data?.time, "dd/MM/yy") : ""}
                </span>
                {post?.data?.edits?.length ? (
                  <>
                    <span>, </span>
                    <span
                      onClick={(e) => post?.viewEdits?.(e)}
                      className="cursor-pointer"
                    >
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
                onClick={(e) => post?.onFlag?.(e)}
                className="rounded-full bg-orange-200 px-4 py-1 hover:bg-orange-900 hover:text-white"
              >
                Flag
              </button>
            </div>
            <div className="text-right">
              <p
                onClick={(e) => post?.viewLocation?.(e)}
                className="cursor-pointer"
              >
                {post?.data?.location}
              </p>
              <p>{post?.data?.price}</p>
            </div>
          </div>
        </div>
        <div className="my-2 flex flex-row justify-between">
          <button
            className="relative ml-2 cursor-pointer rounded-full bg-sky-200 px-4 py-4 hover:bg-sky-900 hover:text-white"
            onClick={(e) => post?.onBack?.(e)}
          >
            <p className="absolute left-0 right-0 -translate-y-1/2 text-lg font-bold">
              {"<"}
            </p>
          </button>
          {post?.canMakeOffer && (
            <div className="mx-2 flex grow rounded-sm border-b-2 border-stone-800">
              <input
                className="grow rounded-sm p-2 ring-sky-500 focus-visible:outline-none focus-visible:ring-2"
                type="text"
                placeholder="Make an offer"
                value={post?.offer}
                onChange={(e) => {
                  post?.setOffer(e.target.value);
                }}
              />
            </div>
          )}
          <button
            className={
              "mr-2 rounded-full px-4 py-2 transition-colors hover:text-white" +
              (post?.offer?.length
                ? " bg-emerald-200 hover:bg-emerald-900"
                : " bg-sky-200 hover:bg-sky-900")
            }
            type="button"
            onClick={(e) => {
              if (!post?.offer?.length) {
                post?.viewOffers?.(e);
              } else {
                post?.onOffer?.(e);
              }
            }}
          >
            <div className="relative flex justify-center">
              <span className={post?.offer?.length ? "invisible" : ""}>
                Offers
              </span>
              <span
                className={
                  post?.offer?.length ? "absolute left-0 right-0" : "hidden"
                }
              >
                Offer
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export const Post = (props) => {
  const post = usePost(props);
  return <PurePost {...post} />;
};

export const fakeData = {
  uuid: "63856492738",
  time: new Date(), // when it was last edited
  title: "Incredible Bicycle! 56 Speed! Super fast! Wow!",
  images: [],
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper mauris augue, vitae sodales odio blandit vel. Curabitur a nisi massa. Nam quis sagittis felis. Nunc feugiat mauris sit amet dolor interdum maximus. Cras semper orci odio, non efficitur arcu aliquet sit amet. In ornare cursus augue. Ut ut sem pulvinar, tincidunt purus vel, convallis velit. Proin fringilla ullamcorper enim et lacinia. Proin mollis dictum ipsum sed faucibus. Fusce laoreet rutrum erat in dapibus. Donec risus tortor, varius ut risus in, aliquam condimentum purus. Nulla euismod eros sed egestas dapibus. Proin eu arcu sed lectus fermentum vestibulum ut ac lorem. Sed id nunc eu neque elementum lobortis. Sed ut nisi facilisis, sodales erat sit amet, ultricies libero.",
  author: {
    id: 765426834098,
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
