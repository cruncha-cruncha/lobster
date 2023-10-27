import { Post, fakeData as fakePost } from "./pages/Post";
import {
  Comments,
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
      <Comments
        postUuid={"725389261519834-23871562374-327625"}
        data={fakeComments}
      />
      {/* <Profile data={fakeProfile} /> */}
      {/* <Account languages={fakeLanguages} data={fakeAccount} /> */}
    </div>
  );
}

export default App;
