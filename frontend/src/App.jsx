import { useAuth, usePersistAccessToken } from "./components/userAuth";
import { useRouter } from "./components/Router/Router";
import { Post } from "./pages/Post";
import { Comments, fakeData as fakeComments } from "./pages/Comments/Comments";
import { Profile, fakeData as fakeProfile } from "./pages/Profile";
import {
  Account,
  fakeLanguages,
  fakeData as fakeAccount,
} from "./pages/Account";
import { Login } from "./pages/Login";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { ResetPassword } from "./pages/ResetPassword";
import { Controller } from "./components/PageSlider/Controller";
import "./App.css";

function UnAuthorizedRoutes() {
  const auth = useAuth();
  const router = useRouter();

  if (auth.isLoggedIn) {
    return <></>;
  }

  return (
    <>
      {router.path === "/" && <Login />}
      {router.path === "/accept-invitation" && <AcceptInvitation />}
      {router.path === "/reset-password" && <ResetPassword />}
    </>
  );
}

function AuthorizedRoutes() {
  const auth = useAuth();
  const router = useRouter();

  // if (!auth.isLoggedIn) {
  //   return <></>;
  // }

  return (
    <>
      {router.path === "/" && <Profile data={fakeProfile} />}
      {router.path === "/account" && (
        <Account languages={fakeLanguages} data={fakeAccount} />
      )}
      {router.path === "/post" && <Post />}
      {router.path === "/comments" && (
        <Comments
          postUuid={"725389261519834-23871562374-327625"}
          data={fakeComments}
        />
      )}
    </>
  );
}

function App() {
  usePersistAccessToken();

  return (
    <>
      <Controller />
      {/* <UnAuthorizedRoutes /> */}
      {/* <AuthorizedRoutes /> */}
    </>
  );
}

export default App;
