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
import { List } from "../../pages/somePosts/List";

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
  "all-user-posts": List,
  "active-user-posts": List,
  "draft-user-posts": List,
  "sold-user-posts": List,
  "deleted-user-posts": List,
  "all-user-offers": List,
  "open-user-offers": List,
  "hit-user-offers": List,
  "deleted-user-offers": List,
  "missed-user-offers": List,
};
