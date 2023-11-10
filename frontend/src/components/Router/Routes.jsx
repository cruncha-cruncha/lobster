import { Profile } from "../../pages/profile";
import { Account } from "../../pages/account";
import { Login } from "../../pages/Login";
import { AcceptInvitation } from "../../pages/AcceptInvitation";
import { ResetPassword } from "../../pages/ResetPassword";
import { Post } from "../../pages/Post";
import { Comments } from "../../pages/Comments/Comments";

export const ROUTES = {
  profile: Profile,
  account: Account,
  login: Login,
  "accept-invitation": AcceptInvitation,
  "reset-password": ResetPassword,
  post: Post,
  "new-post": null,
  "edit-post": null,
  comments: Comments,
};
