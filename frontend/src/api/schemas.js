import Ajv from "ajv";

const ajv = new Ajv();

const tokensSchema = {
  type: "object",
  $id: "#tokens",
  properties: {
    user_id: { type: "integer" },
    claims_level: { type: "integer" },
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
  required: ["user_id", "claims_level", "access_token", "refresh_token"],
};

const refreshAccessTokenSchema = {
  type: "object",
  $id: "#refreshAccessToken",
  properties: {
    user_id: { type: "integer" },
    claims_level: { type: "integer" },
    access_token: { type: "string" },
    refresh_token: { type: "null" },
  },
  required: ["user_id", "claims_level", "access_token"],
};

const countriesSchema = {
  type: "array",
  $id: "#countries",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      short: { type: "string" },
    },
    required: ["id", "name", "short"],
  },
};

const profileHistorySchema = {
  type: "object",
  $id: "#profileHistory",
  properties: {
    oldest_post_uuid: { type: ["string", "null"] },
    oldest_post_date: { type: ["string", "null"] },
    newest_post_uuid: { type: ["string", "null"] },
    newest_post_date: { type: ["string", "null"] },
    oldest_comment_uuid: { type: ["string", "null"] },
    oldest_comment_date: { type: ["string", "null"] },
    newest_comment_uuid: { type: ["string", "null"] },
    newest_comment_date: { type: ["string", "null"] },
  },
  required: [
    "oldest_post_uuid",
    "oldest_post_date",
    "newest_post_uuid",
    "newest_post_date",
    "oldest_comment_uuid",
    "oldest_comment_date",
    "newest_comment_uuid",
    "newest_comment_date",
  ],
};

const accountSchema = {
  type: "object",
  $id: "#account",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    email: { type: "string" },
    language: { type: "integer" },
    country: { type: "integer" },
  },
  required: ["id", "name", "email", "language", "country"],
};

const profileSchema = {
  type: "object",
  $id: "#profile",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    language: { type: "integer" },
    country: { type: "string" },
    banned_until: { type: ["string", "null"] },
    changes: { type: "array", items: { $ref: "#singleChange" } },
    all_posts: { type: "integer" },
    deleted_posts: { type: "integer" },
    draft_posts: { type: "integer" },
    sold_posts: { type: "integer" },
    all_comments: { type: "integer" },
    deleted_comments: { type: "integer" },
    lost_comments: { type: "integer" },
    active_comments: { type: "integer" },
    missed_comments: { type: "integer" },
    bought_comments: { type: "integer" },
  },
  required: ["id", "name", "country", "language", "banned_until", "changes"],
};

const singleCommentSchema = {
  type: "object",
  $id: "#singleComment",
  properties: {
    uuid: { type: "string" },
    post_uuid: { type: "string" },
    author_id: { type: "integer" },
    poster_id: { type: "integer" },
    content: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted: { type: "boolean" },
    changes: { type: "array", items: { $ref: "#singleChange" } },
    unread_by_author: { type: ["array", "null"], items: { type: "string" } },
    unread_by_poster: { type: ["array", "null"], items: { type: "string" } },
  },
  required: [
    "uuid",
    "post_uuid",
    "author_id",
    "poster_id",
    "content",
    "created_at",
    "updated_at",
    "deleted",
    "changes",
    "unread_by_author",
    "unread_by_poster",
  ],
};

const unreadActivitySchema = {
  type: "object",
  $id: "#unreadActivity",
  properties: {
    comments: { type: "array", items: { $ref: "#singleComment" } },
    authors: { type: "array", items: { type: "string" } },
    posts: { type: "array", items: { $ref: "#singlePost" } },
    offers: { type: "array", items: { $ref: "#singleComment" } },
    wants: { type: "array", items: { $ref: "#singlePost" } },
  },
  required: ["comments", "authors", "posts", "offers", "wants"],
};

const currenciesSchema = {
  type: "array",
  $id: "#currencies",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      symbol: { type: "string" },
    },
    required: ["id", "name", "symbol"],
  },
};

const languagesSchema = {
  type: "array",
  $id: "#languages",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
    },
    required: ["id", "name"],
  },
};

const singleChangeSchema = {
  type: "object",
  $id: "#singleChange",
  properties: {
    who: { type: "string" },
    when: { type: "string" },
  },
  required: ["who", "when"],
};

const singlePostSchema = {
  type: "object",
  $id: "#singlePost",
  properties: {
    uuid: { type: "string" },
    author_id: { type: "integer" },
    title: { type: "string" },
    images: { type: "array", items: { type: "string" } },
    content: { type: "string" },
    price: { type: "number" },
    currency: { type: "number" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted: { type: "boolean" },
    draft: { type: "boolean" },
    changes: { type: "array", items: { $ref: "#singleChange" } },
  },
  required: [
    "uuid",
    "author_id",
    "title",
    "images",
    "content",
    "price",
    "currency",
    "latitude",
    "longitude",
    "created_at",
    "updated_at",
    "deleted",
    "draft",
    "changes",
  ],
};

const getPostSchema = {
  allOf: [{ $ref: "#singlePost" }],
  type: "object",
  $id: "#getPost",
  properties: {
    author_name: { type: "string" },
    my_comment: { oneOf: [{ type: "null" }, { $ref: "#singleComment" }] },
  },
  required: ["author_name", "my_comment"],
};

const makeLazyValidator = (schema) => {
  let validate = null;
  return (data) => {
    if (!validate) {
      if (Array.isArray(schema)) {
        schema.slice(0, schema.length - 1).forEach((s) => {
          if (!ajv.getSchema(s.$id)) {
            ajv.addSchema(s);
          }
        });
        validate = ajv.compile(schema[schema.length - 1]);
      } else {
        validate = ajv.compile(schema);
      }
    }

    if (!validate) validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) console.error("schema validation errors", validate.errors);
    return valid;
  };
};

export const validateTokens = makeLazyValidator(tokensSchema);

export const validateRefreshAccessToken = makeLazyValidator(
  refreshAccessTokenSchema,
);

export const validateGetPost = makeLazyValidator([
  singleChangeSchema,
  singlePostSchema,
  singleCommentSchema,
  getPostSchema,
]);

export const validateProfile = makeLazyValidator([
  singleChangeSchema,
  profileSchema,
]);

export const validateUnreadActivity = makeLazyValidator([
  singleChangeSchema,
  singleCommentSchema,
  singlePostSchema,
  unreadActivitySchema,
]);

export const validateProfileHistory = makeLazyValidator(profileHistorySchema);

export const validateCountries = makeLazyValidator(countriesSchema);

export const validateCurrencies = makeLazyValidator(currenciesSchema);

export const validateLanguages = makeLazyValidator(languagesSchema);

export const validateAccount = makeLazyValidator(accountSchema);

export const validateSinglePost = makeLazyValidator(singlePostSchema);
