import { Profile } from "../../pages/Profile";
import { Results } from "../../pages/search/Results";
import { NewPost } from "../../pages/NewPost";
import { Account } from "../../pages/Account";
import { Login } from "../../pages/Login";
import { AcceptInvitation } from "../../pages/AcceptInvitation";
import { ResetPassword } from "../../pages/ResetPassword";
import { Post } from "../../pages/Post";
import { Comments } from "../../pages/comments/Comments";
import { EditPost } from "../../pages/EditPost";

export const INITIAL_PATH = "/login";

export const ROUTES = {
  profile: Profile,
  account: Account,
  login: Login,
  "accept-invitation": AcceptInvitation,
  "reset-password": ResetPassword,
  post: Post,
  "new-post": NewPost,
  "edit-post": EditPost,
  comments: Comments,
  search: Results,
};
