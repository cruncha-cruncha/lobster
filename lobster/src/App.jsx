import { Post, usePost, fakeData as fakePost } from "./pages/Post";
import {
  Comments,
  fakePostData as fakeCommentPostData,
  fakeData as fakeComments,
  useComments,
} from "./pages/Comments";
import { Profile, useProfile, fakeData as fakeProfile } from "./pages/Profile";
import {
  Account,
  useAccount,
  fakeLanguages,
  fakeData as fakeAccount,
} from "./pages/Account";
import "./App.css";

function App() {
  return (
    <div id="app">
      {/* <Post { ...usePost({ data: fakePost })} /> */}
      {/* <Comments
        {...useComments({
          fakePostData: fakeCommentPostData,
          data: fakeComments,
        })}
      /> */}
      {/* <Profile { ...useProfile({ data: fakeProfile })} /> */}
      <Account
        {...useAccount({ languages: fakeLanguages, data: fakeAccount })}
      />
    </div>
  );
}

export default App;
