import { useState, useEffect, useReducer } from "react";
import { useRouter, getLastPathSegment } from "../components/router/Router";
import { useInfoModal, PureInfoModal } from "../components/InfoModal";
import { validatePassword } from "./Login";
import { useAuth } from "../components/userAuth";
import * as endpoints from "../api/endpoints";

const initialState = {
  name: "",
  language: 0,
  country: 0,
  oldPassword: "",
  newPassword: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "name":
      return { ...state, name: action.payload };
    case "oldPassword":
      return { ...state, oldPassword: action.payload };
    case "newPassword":
      return { ...state, newPassword: action.payload };
    case "language":
      return { ...state, language: action.payload };
    case "country":
      return { ...state, country: action.payload };
    default:
      console.error("uncaught reduce ", action);
      return state;
  }
};

export const useAccount = () => {
  const auth = useAuth();
  const router = useRouter();
  const modal = useInfoModal();
  const [data, setData] = useState(fakeData);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  const userId = getLastPathSegment();

  useEffect(() => {
    let mounted = true;

    endpoints
      .getAccount({
        userId: userId,
        accessToken: auth.accessToken,
      })
      .then((res) => {
        if (res.status === 200 && mounted) {
          setData(res.data);
          if (state.name == "") {
            dispatch({ type: "name", payload: res.data.name });
          }
          if (state.language == 0) {
            dispatch({ type: "language", payload: res.data.language });
          }
          if (state.country == 0) {
            dispatch({ type: "country", payload: res.data.country });
          }
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onLogout = () => {
    auth.logout();
    router.goTo("/login", "back");
  };

  const havePasswords = state.oldPassword && state.newPassword;
  const validPasswords =
    validatePassword(state.newPassword) && validatePassword(state.oldPassword);
  const haveOthers = state.language && state.country && state.name;
  const canSave = havePasswords
    ? haveOthers && validPasswords
    : haveOthers &&
      !state.newPassword &&
      (state.name != data?.name ||
        state.language != data?.language ||
        state.country != data?.country);

  const onSave = () => {
    if (havePasswords) {
      // TODO: update password
      modal.open(
        "Request failed. Please check your current password and try again later",
        "error",
      );
    } else {
      endpoints.updateAccount({
        userId: userId,
        accessToken: auth.accessToken,
        data: {
          name: state.name,
          language: state.language,
          country: state.country,
        },
      });
    }
  };

  const setNewPassword = (e) => {
    const val = e.target.value;
    dispatch({ type: "newPassword", payload: val });

    if (val.length <= 0) {
      dispatch({ type: "oldPassword", payload: "" });
    }
  };

  return {
    ...state,
    email: data?.email,
    showNewPassword,
    showOldPassword,
    setName: (e) => dispatch({ type: "name", payload: e.target.value }),
    setLanguage: (e) =>
      dispatch({ type: "language", payload: Number(e.target.value) }),
    setCountry: (e) =>
      dispatch({ type: "country", payload: Number(e.target.value) }),
    setOldPassword: (e) =>
      dispatch({ type: "oldPassword", payload: e.target.value }),
    setNewPassword,
    languageOptions: [],
    countryOptions: [],
    isLoading: false,
    toggleShowNewPassword: () => setShowNewPassword((prev) => !prev),
    toggleShowOldPassword: () => setShowOldPassword((prev) => !prev),
    onBack: () => router.goTo(`/profile/${userId}`, "down"),
    onLogout,
    onSave,
    canSave,
    modal,
  };
};

export const PureAccount = (account) => {
  // POST STATES AND TRANSITIONS
  // -> draft ('post-draft-created')
  // -> active ('post-active-created')
  // draft -> active ('post-draft-to-active')
  // draft -> deleted ('post-draft-to-deleted')
  // active -> draft ('post-active-to-draft')
  // active -> sold ('post-active-to-sold')
  // active -> deleted ('post-active-to-deleted')

  // POST EDITS are all the above, plus 'post-content-edited'
  // COMMENT EDITS are 'comment-created', 'comment-content-edited', 'comment-deleted', and 'comment-un-deleted'
  // REPLY EDITS are 'reply-created', 'reply-content-edited', 'reply-deleted', and 'reply-un-deleted'
  // both the commenter and the poster can delete and un-delete comments and replies
  // all edits must have a time

  // moving a post from active -> draft or draft -> active does not change 'viewed' status
  // selling or deleting a post marks all comments as unviewed
  // comments and replies on a draft, deleted, or sold post cannot be created, edited, or deleted, but they can be viewed

  // as a seller, clicking on a comment marks it as viewed for the seller
  // as a buyer, clicking on a comment marks it as viewed for the buyer
  // as a seller, any reply action marks the comment as unviewed for the buyer
  // as a buyer, any comment or reply action marks the comment as unviewed for the seller

  // NEED AN ENDPOINT TO GET UNVIEWED COMMENTS

  // If we want more notifications (like "someone else has also commented on a post you commented on")
  // then I think we need noSQL

  return (
    <>
      <PureInfoModal {...account.modal} />
      <div className="flex min-h-full justify-center">
        <div className="flex w-full max-w-md flex-col justify-between pb-2 pt-5">
          <div>
            <h1 className="mb-2 text-center text-lg">Account</h1>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <label
                  htmlFor="name"
                  className="my-2 border-b-2 border-transparent py-1"
                >
                  Name
                </label>
              </div>
              <div className="m-2 grow rounded-sm border-b-2 border-stone-800">
                <input
                  type="text"
                  id="name"
                  placeholder="Name"
                  value={account?.name}
                  onChange={(e) => account?.setName?.(e)}
                  className="w-full rounded-sm px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
                />
              </div>
            </div>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <p className="my-2 border-b-2 border-transparent py-1">Email</p>
              </div>
              <p className="m-2 grow rounded-sm border-b-2 border-transparent px-2 py-1">
                {account?.email}
              </p>
            </div>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <label
                  htmlFor="language"
                  className="my-2 border-b-2 border-transparent py-1"
                >
                  Language
                </label>
              </div>
              <select
                className={
                  "m-2 grow rounded-sm border-b-2 border-stone-800 bg-white px-2 py-1" +
                  (account?.language != "0" ? "" : " text-stone-400")
                }
                value={account?.language}
                onChange={(e) => account?.setLanguage?.(e)}
                id="language"
              >
                <option value="0" disabled className="placeholder">
                  Language
                </option>
                <option value="1">English</option>
                <option value="2">Spanish</option>
                <option value="3">French</option>
              </select>
            </div>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <label
                  htmlFor="country"
                  className="my-2 border-b-2 border-transparent py-1"
                >
                  Country
                </label>
              </div>
              <select
                className={
                  "m-2 grow rounded-sm border-b-2 border-stone-800 bg-white px-2 py-1" +
                  (account?.country != "0" ? "" : " text-stone-400")
                }
                value={account?.country}
                onChange={(e) => account?.setCountry?.(e)}
                id="country"
              >
                <option value="0" disabled className="placeholder">
                  Country
                </option>
                <option value="1">Canada</option>
                <option value="2">USA</option>
              </select>
            </div>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <label
                  htmlFor="newPassword"
                  className="my-2 mb-1 border-b-2 border-transparent py-1"
                >
                  Password
                </label>
              </div>
              <div className="m-2 mb-1 grow rounded-sm border-b-2 border-stone-800">
                <div className="relative flex items-center rounded-sm ring-sky-500 transition-shadow focus-within:ring-2">
                  <input
                    id="password"
                    type={account?.showNewPassword ? "text" : "password"}
                    className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
                    placeholder="New Password"
                    value={account?.newPassword}
                    onChange={(e) => account?.setNewPassword?.(e)}
                  />
                  <div
                    className="relative cursor-pointer"
                    onClick={(e) => account?.toggleShowNewPassword?.(e)}
                  >
                    <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
                    <span className="py-1 pl-1 pr-2 text-sm text-stone-400">
                      {account?.showNewPassword ? "hide" : "show"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="flex w-24 flex-col items-end">
                <label
                  htmlFor="oldPassword"
                  className={
                    "my-2 border-b-2 border-transparent py-1 transition-opacity" +
                    (account?.newPassword ? " opacity-100" : " opacity-0")
                  }
                >
                  Current
                </label>
              </div>
              <div
                className={
                  "m-2 mb-1 grow rounded-sm border-b-2 border-stone-800 transition-opacity" +
                  (account?.newPassword ? " opacity-100" : " opacity-0")
                }
              >
                <div className="relative flex items-center rounded-sm ring-sky-500 transition-shadow focus-within:ring-2">
                  <input
                    id="password"
                    type={account?.showOldPassword ? "text" : "password"}
                    className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
                    placeholder="Current Password"
                    value={account?.oldPassword}
                    onChange={(e) => account?.setOldPassword?.(e)}
                    disabled={!account?.newPassword}
                  />
                  <div
                    className="relative cursor-pointer"
                    onClick={(e) => account?.toggleShowOldPassword?.(e)}
                  >
                    <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
                    <span className="py-1 pl-1 pr-2 text-sm text-stone-400">
                      {account?.showOldPassword ? "hide" : "show"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hide-while-sliding flex justify-between">
            <p
              className="cursor-pointer p-2 text-lg font-bold"
              onClick={(e) => account?.onBack?.(e)}
            >
              {"<"}
            </p>
            <div className="flex">
              <button
                className="rounded-full bg-orange-200 px-4 py-2 hover:bg-orange-900 hover:text-white"
                onClick={(e) => account?.onLogout?.(e)}
              >
                Logout
              </button>
              <button
                className={
                  "ml-2 rounded-full px-4 py-2 transition-colors" +
                  (account?.canSave
                    ? " bg-emerald-200 hover:bg-emerald-900 hover:text-white"
                    : " bg-stone-300 text-white")
                }
                onClick={(e) => account?.onSave?.(e)}
                disabled={!account?.canSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Account = (props) => {
  const account = useAccount(props);
  return <PureAccount {...account} />;
};

export const fakeData = {
  id: 2,
  name: "Jane",
  language: "1",
  country: "1",
};
