export const useAccount = ({ languages, data }) => {
  return {
    data,
    languages,
  };
};

export const Account = (account) => {
  // POST STATES AND TRANSITIONS
  // -> draft ('post-draft-created')
  // -> active ('post-active-created')
  // draft -> active ('post-draft-to-active')
  // draft -> deleted ('post-draft-to-deleted')
  // active -> draft ('post-active-to-draft')
  // active -> sold ('post-active-to-sold')
  // active -> deleted ('post-active-to-deleted')

  // POST EDITS are all the above, plus 'post-content-edited'
  // COMMENT EDITS are 'comment-created', 'comment-content-edited', 'comment-deleted', and 'comment-un-deleted'
  // REPLY EDITS are 'reply-created', 'reply-content-edited', 'reply-deleted', and 'reply-un-deleted'
  // both the commenter and the poster can delete and un-delete comments and replies
  // all edits must have a time

  // deleting a post is irreversible
  // deleting a comment or reply IS reversible

  // moving a post from active -> draft or draft -> active does not change 'viewed' status
  // selling or deleting a post marks all comments as unviewed
  // comments and replies on a draft, deleted, or sold post cannot be created, edited, or deleted, but they can be viewed

  // as a seller, clicking on a comment marks it as viewed for the seller
  // as a buyer, clicking on a comment marks it as viewed for the buyer
  // as a seller, any reply action marks the comment as unviewed for the buyer
  // as a buyer, any comment or reply action marks the comment as unviewed for the seller

  // NEED AN ENDPOINT TO GET UNVIEWED COMMENTS

  // If we want more notifications (like "someone else has also commented on a post you commented on")
  // then I think we need noSQL

  return (
    <div>
      <p>Name: {account?.data?.name}</p>
      <p>Language: {account?.data?.language}</p>
      <p>Location: {account?.data?.location}</p>
      <p>Country: {account?.data?.country}</p>
      <div>
        <p>My Posts</p>
        <p>with new activity</p>
        <p>all</p>
      </div>
      <div>
        <p>My Offers</p>
        <p>all</p>
      </div>
    </div>
  );
};

export const fakeLanguages = [
  {
    id: 1,
    name: "English",
  },
  {
    id: 2,
    name: "Spanish",
  },
  {
    id: 3,
    name: "French",
  },
];

export const fakeData = {
  id: 2,
  name: "Jane",
  language: "1",
  location: "New York",
  country: "USA",
  posts: [
    // just posts with recent activity
    {
      post: {
        uuid: "1",
        title: "title",
        price: "$12 CAD",
        images: [],
      },
      notifications: [
        {
          type: "comment-created",
        },
      ],
      // comment-created
      // comment-content-edited
      // comment-deleted
      // comment-un-deleted
      // reply-created
      // reply-content-edited
      // reply-deleted
      // reply-un-deleted
      // my-reply-deleted
      // my-reply-un-deleted
    },
  ],
  offers: [
    // just offers with recent activity
    {
      post: {
        uuid: "1",
        title: "title",
        price: "$12 CAD",
        images: [],
        author: {
          id: 765426834098,
          name: "Douglas",
        },
      },
      notifications: [
        {
          type: "",
        },
      ],
      // poster-reply-created
      // poster-reply-content-edited
      // poster-reply-deleted
      // poster-reply-un-deleted
      // my-comment-deleted
      // my-comment-un-deleted
      // my-reply-deleted
      // my-reply-un-deleted
      // post-active-to-sold
      // post-active-to-sold and now I can leave a review?
      // post-draft-to-deleted
      // post-active-to-deleted
    },
  ],
};
