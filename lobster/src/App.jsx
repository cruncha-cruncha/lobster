import { Post, fakePost } from "./pages/post";
import { Comments, fakePostData, fakeComments } from "./pages/Comments";
import { Profile, fakeProfile } from "./pages/Profile";
import "./App.css";

function App() {
  return (
    <div id="app">
      {/* <Post post={fakePost} /> */}
      <Comments postData={fakePostData} comments={fakeComments} />
      {/* <Profile profile={fakeProfile} /> */}
    </div>
  );
}

export default App;
