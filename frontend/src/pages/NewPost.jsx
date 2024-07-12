import { useEffect, useReducer, useState } from "react";
import { PureEditPostContent } from "./EditPost";
import { useRouter } from "../components/router/Router";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

const initialState = {
  title: "",
  description: "",
  images: [],
  location: "",
  price: "",
  currency: 0,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "title":
      return { ...state, title: action.value };
    case "description":
      return { ...state, description: action.value };
    case "images":
      return { ...state, images: action.value };
    case "location":
      return { ...state, images: action.value };
    case "price":
      return { ...state, price: action.value };
    case "currency":
      return { ...state, currency: action.value };
    default:
      return state;
  }
};

export const useNewPost = () => {
  const router = useRouter();
  const auth = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [currencyOptions, setCurrencyOptions] = useState([]);

  const canPublish = state.title && state.description && state.price && state.currency;

  useEffect(() => {
    let mounted = true;

    endpoints.getCurrencies().then((res) => {
      if (res.status !== 200 || !mounted) return;
      setCurrencyOptions(
        res.data.map((c) => ({ value: c.id, label: c.symbol })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  const onBack = () => {
    router.goTo(`/profile/${auth.user.userId}`, "back");
  };

  const onPublish = () => {
    const price = Number(state.price);
    if (isNaN(price)) {
      alert("Price must be a number");
      return;
    }

    const currency = Number(state.currency);
    if (isNaN(currency)) {
      alert("Currency must be a number");
      return;
    }

    endpoints.createNewPost({
      accessToken: auth.accessToken,
      data: {
        title: state.title,
        content: state.description,
        images: state.images,
        location: state.location,
        price: price,
        currency: currency,
        latitude: 0,
        longitude: 0,
        draft: false,
      }
    }).then((res) => {
      if (!res.status === 200) return;
      router.goTo(`/post/${res.data.uuid}`, "back", true);
    })
  };

  return {
    ...state,
    onBack,
    canPublish,
    canDraft: true,
    onPublish,
    onDraft: () => {},
    currencyOptions,
    setCurrency: (e) => dispatch({ type: "currency", value: e.target.value }),
    setTitle: (e) => dispatch({ type: "title", value: e.target.value }),
    setDescription: (e) => dispatch({ type: "description", value: e.target.value }),
    setPrice: (e) => dispatch({ type: "price", value: e.target.value }),
    setLocation: (e) => dispatch({ type: "location", value: e.target.value }),
  };
};

export const PureNewPost = (newPost) => {
  return (
    <>
      <div className="flex min-h-full justify-center">
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
    <div className="hide-while-sliding flex justify-between">
      <p
        className="cursor-pointer p-2 text-lg font-bold"
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
