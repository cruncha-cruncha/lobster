export const Account = ({ account }) => {
  // NEED AN ENDPOINT TO GET COMMENTS WITH UNVIEWED REPLIES
  // also, to get posts with unviewed comments
  // as soon as you click on a comment, the comment and all it's replies are marked as viewed
  // drafting a post does not change 'viewed' status
  // selling or deleting a post marks all comments and replies as 'viewed'
  // users cannot make comments or replies on a deleted, drafted, or sold post
  // delete is irreversible
  // edits: draft -> active, active -> draft, comment -> deleted comment, deleted comment -> comment, regular edit
  // all edits must have a time

  // POST STATES AND TRANSITIONS
  // -> draft
  // -> active
  // draft -> active
  // draft -> deleted
  // active -> draft
  // active -> sold
  // active -> deleted

  return (
    <div>
      <p>Name</p>
      <p>Language</p>
      <p>Location (+ country)</p>
      <div>
        <p>Posts</p>
        <p>with new comments / replies</p>
      </div>
      <div>
        <p>Offers</p>
      </div>
    </div>
  );
};

export const fakeAccount = {
  id: "1",
  name: "John",
  language: "English",
  location: "New York, NY, USA",
}
