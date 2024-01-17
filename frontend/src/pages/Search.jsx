import { useRouter } from "../components/router/Router";
import { useAuth } from "../components/userAuth";

export const useSearch = () => {
  const router = useRouter();
  const auth = useAuth();

  const goToMyProfile = () => {
    router.goTo(`/profile?userId=${auth.user.userId}`, "up");
  };

  const goToPost = () => {
    router.goToWithBack("/post", "left");
  };

  return {
    goToMyProfile,
    goToPost,
  };
};

export const PureSearch = (search) => {
  return (
    <div className="flex h-full flex-col justify-between p-2">
      <div>
        <input type="text" placeholder="search" />
        <p>location (and country) + radius</p>
        <p>min/max price</p>
        <p>include: active, sold, draft, or deleted posts</p>
        <p>secret, url-only option to limit to a list of users</p>
        <p>secret, url-only option to limit to a list of collections</p>
        <p>
          order by: relevance, offers (most), offers (least), newest, oldest,
          price (low to high), price (high to low)
        </p>
        <p>then order by: (the same, minus relevance)</p>
      </div>
      <div className="flex justify-end">
        <button
          className="mr-2 rounded-full bg-sky-200 px-4 py-2 hover:bg-sky-900 hover:text-white"
          onClick={(e) => search?.goToMyProfile?.(e)}
        >
          Profile
        </button>
        <button
          className="rounded-full bg-emerald-200 px-4 py-2 hover:bg-emerald-900 hover:text-white"
          onClick={(e) => search?.goToPost?.(e)}
        >
          See Post
        </button>
      </div>
    </div>
  );
};

export const Search = (props) => {
  const search = useSearch(props);
  return <PureSearch {...search} />;
};
