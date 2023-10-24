import { Post, fakePost } from "./pages/Post";
import { Comments, fakePostData, fakeComments } from "./pages/Comments";
import { Profile, fakeProfile } from "./pages/Profile";
import { Account } from "./pages/Account";
import "./App.css";

function App() {
  return (
    <div>
      {/* <Post post={fakePost} /> */}
      {/* <Comments postData={fakePostData} comments={fakeComments} /> */}
      {/* <Profile profile={fakeProfile} /> */}
      <Account />
    </div>
  );
}

export default App;
