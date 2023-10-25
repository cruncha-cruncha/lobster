import { Post, fakeData as fakePost } from "./pages/Post";
import {
  Comments,
  fakePostData as fakeCommentPostData,
  fakeData as fakeComments,
} from "./pages/Comments/Comments";
import { Profile, fakeData as fakeProfile } from "./pages/Profile";
import {
  Account,
  fakeLanguages,
  fakeData as fakeAccount,
} from "./pages/Account";
import "./App.css";

function App() {
  return (
    <div id="app">
      {/* <Post data={fakePost} /> */}
      {/* <Comments
        fakePostData={fakeCommentPostData}
        data={fakeComments}
      /> */}
      {/* <Profile data={fakeProfile} /> */}
      <Account languages={fakeLanguages} data={fakeAccount} />
    </div>
  );
}

export default App;
