import Ajv from "ajv";

const ajv = new Ajv();

const tokensSchema = {
  type: "object",
  properties: {
    user_id: { type: "integer" },
    claims_level: { type: "integer" },
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
  required: ["user_id", "claims_level", "access_token", "refresh_token"],
  additionalProperties: false,
};

const refreshAccessTokenSchema = {
  type: "object",
  properties: {
    user_id: { type: "integer" },
    claims_level: { type: "integer" },
    access_token: { type: "string" },
    refresh_token: { type: "null" },
  },
  required: ["user_id", "claims_level", "access_token"],
  additionalProperties: false,
};

const countriesSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      short: { type: "string" },
    },
    required: ["id", "name", "short"],
    additionalProperties: false,
  },
};

const currenciesSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      symbol: { type: "string" },
    },
    required: ["id", "name", "symbol"],
    additionalProperties: false,
  },
};

const languagesSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
    },
    required: ["id", "name"],
    additionalProperties: false,
  },
};

const singleChangeSchema = {
  type: "object",
  $id: "#singleChange",
  properties: {
    who: { type: "string" },
    when: { type: "string" },
  },
};

const getPostSchema = {
  type: "object",
  properties: {
    uuid: { type: "string" },
    author_id: { type: "integer" },
    author_name: { type: "string" },
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
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          uuid: { type: "string" },
          post_uuid: { type: "string" },
          author_id: { type: "integer" },
          content: { type: "string" },
          created_at: { type: "string" },
          updated_at: { type: "string" },
          deleted: { type: "boolean" },
          changes: { type: "array", items: { $ref: "#singleChange" } },
          viewed_by_author: { type: "boolean" },
          viewed_by_poster: { type: "boolean" },
        },
        required: [
          "uuid",
          "post_uuid",
          "author_id",
          "content",
          "created_at",
          "updated_at",
          "deleted",
          "changes",
          "viewed_by_author",
          "viewed_by_poster",
        ],
        additionalProperties: false,
      },
    },
  },
  required: [
    "uuid",
    "author_id",
    "author_name",
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
    "comments",
  ],
  additionalProperties: false,
};

const makeLazyValidator = (schema) => {
  let validate = null;
  return (data) => {
    if (!validate) {
      if (Array.isArray(schema)) {
        schema.slice(0, schema.length - 1).forEach((s) => ajv.addSchema(s));
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
  getPostSchema,
]);

export const validateCountries = makeLazyValidator(countriesSchema);

export const validateCurrencies = makeLazyValidator(currenciesSchema);

export const validateLanguages = makeLazyValidator(languagesSchema);
