import Ajv from "ajv";

const ajv = new Ajv();

const tokensSchema = {
  type: "object",
  $id: "#tokens",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
  },
  required: ["accessToken", "refreshToken"],
};

const refreshedTokensSchema = {
  type: "object",
  $id: "#refreshedTokens",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "null" },
  },
  required: ["accessToken"],
};

const libraryInfoSchema = {
  type: "object",
  $id: "#libraryInfo",
  properties: {
    uuid: { type: "string" },
    name: { type: "string" },
    maximumRentalPeriod: { type: "number" },
    maximumFuture: { type: "number" },
  },
  required: ["uuid", "name", "maximumRentalPeriod", "maximumFuture"],
};

const genericOptionSchema = {
  type: "object",
  $id: "#genericOption",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
};

const allStatusOptionsSchema = {
  type: "object",
  $id: "#allStatusOptions",
  properties: {
    stores: { type: "array", items: { $ref: "#genericOption" } },
    users: { type: "array", items: { $ref: "#genericOption" } },
    tools: { type: "array", items: { $ref: "#genericOption" } },
    grievances: { type: "array", items: { $ref: "#genericOption" } },
    permissions: { type: "array", items: { $ref: "#genericOption" } },
  },
  required: [
    "stores",
    "users",
    "tools",
    "grievances",
    "permissions",
  ],
};

const roleOptionsSchema = {
  type: "object",
  $id: "#roleOptions",
  properties: {
    roles: { type: "array", items: { $ref: "#genericOption" } },
  },
  required: ["roles"],
};

const userInfoSchema = {
  type: "object",
  $id: "#userInfo",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    status: { type: "number" },
    emailAddress: { type: "string" },
    createdAt: { type: "string" },
  },
  required: ["id", "username", "status", "emailAddress", "createdAt"],
};

const filteredUsersSchema = {
  type: "object",
  $id: "#fliteredUsers",
  properties: {
    users: { type: "array", items: { $ref: "#userInfo" } },
  },
  required: ["users"],
};

const storeInfoSchema = {
  type: "object",
  $id: "#storeInfo",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    status: { type: "number" },
    emailAddress: { type: "string" },
    phoneNumber: { type: "string" },
    rentalInformation: { type: "string" },
    otherInformation: { type: "string" },
    code: { type: "string" },
    createdAt: { type: "string" },
  },
  required: ["id", "name", "status", "emailAddress", "phoneNumber", "rentalInformation", "otherInformation", "code", "createdAt"],
}

const storeSearchResultsSchema = {
  type: "object",
  $id: "#storeSearchResults",
  properties: {
    stores: { type: "array", items: { $ref: "#storeInfo" } },
  },
  required: ["stores"],
}

const storePermissionInfoSchema = {
  type: "object",
  $id: "#storePermissionInfo",
  properties: {
    storeId: { type: "number" },
    storeName: { type: "string" },
    roles: { type: "array", items: { type: "number" } },
  },
  required: ["storeId", "storeName", "roles"],
}

const userPermissionsSchema = {
  type: "object",
  $id: "#userPermissions",
  properties: {
    library: { type: "array", items: { type: "number" } },
    store: { type: "array", items: { $ref: "#storePermissionInfo" } },
  },
  required: ["library", "store"],
}

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

export const validateRefreshedTokens = makeLazyValidator(refreshedTokensSchema);

export const validateLibraryInformation = makeLazyValidator(libraryInfoSchema);

export const validateStatusOptions = makeLazyValidator([
  genericOptionSchema,
  allStatusOptionsSchema,
]);

export const validateRoleOptions = makeLazyValidator([
  genericOptionSchema,
  roleOptionsSchema,
]);

export const validateUserInfo = makeLazyValidator(userInfoSchema);

export const validateFilteredUsers = makeLazyValidator([
  userInfoSchema,
  filteredUsersSchema,
]);

export const validateStoreInfo = makeLazyValidator(storeInfoSchema);

export const validateStoreSearchResults = makeLazyValidator([
  storeInfoSchema,
  storeSearchResultsSchema,
]);

export const validateUserPermissions = makeLazyValidator([
  storePermissionInfoSchema,
  userPermissionsSchema,
]);
