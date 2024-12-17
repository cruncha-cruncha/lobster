import {
  validateTokens,
  validateRefreshedTokens,
  validateGetPost,
  validateLanguages,
  validateCurrencies,
  validateCountries,
  validateProfile,
  validateUnreadActivity,
  validateProfileHistory,
  validateAccount,
  validateSinglePost,
  validateSingleComment,
  validatePostComments,
  validateSingleReply,
  validatePostSearchResponse,
  validateGetPeople,
  validateListOfPosts,
  validateLibraryInformation,
} from "./schemas";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3000";
const searchUrl = import.meta.env.VITE_SEARCH_URL || "http://127.0.0.1:3001";

// const handle = (url, params) => {
//   return fetch(url, params)
//     .then((res) => {
//       if (!res.ok) {
//         return {
//           status: res.status,
//           data: null,
//         };
//       }

//       return res
//         .json()
//         .then((data) => {
//           return {
//             status: res.status,
//             data: data,
//           };
//         })
//         .catch(() => {
//           return {
//             status: res.status,
//             data: null,
//           };
//         });
//     })
//     .catch(() => {
//       // unrecoverable
//       return {
//         status: null,
//         data: null,
//       };
//     });
// };

const handle = (url, params) => {
  return fetch(url, params).then((res) => {
    if (!res.ok) {
      throw new Error(res.status);
    }

    return res.json();
  }).catch((e) => {
    const message = e.message;
    if (message.length === 3 && parseInt(message, 10) !== NaN) {
      throw new Error(parseInt(message, 10));
    } else {
      throw new Error(500);
    }
  });
};

export const getLibraryInformation = async () => {
  // throw new Error("Not implemented");
  const response = await handle(`${serverUrl}/library`, {
    method: "GET",
  });

  if (response.status === 200) {
    const valid = validateLibraryInformation(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const createLibrary = async ({ name }) => {
  const response = await handle(`${serverUrl}/library`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return response;
};

export const login = async ({ email }) => {
  const response = await handle(`${serverUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (response.status === 200) {
    const valid = validateTokens(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const requestInvitation = async ({ email }) => {
  return handle(`${serverUrl}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const acceptInvitation = async ({
  code,
  email,
  name,
  password,
  language,
  country,
}) => {
  const response = await handle(`${serverUrl}/invitations/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name,
      password,
      language: Number(language),
      country: Number(country),
    }),
  });

  if (response.status === 200) {
    const valid = validateTokens(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const requestPasswordReset = async ({ email }) => {
  const response = await handle(`${serverUrl}/password-resets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return response;
};

export const resetPassword = async ({ code, email, password }) => {
  const response = await handle(`${serverUrl}/password-resets/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return response;
};

export const refreshAccessToken = async ({ refreshToken }) => {
  const response = await handle(`${serverUrl}/tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateRefreshedTokens(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getPost = async ({ uuid, accessToken }) => {
  const response = await handle(`${serverUrl}/posts/${uuid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateGetPost(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getLanguages = async () => {
  const response = await handle(`${serverUrl}/languages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 200) {
    const valid = validateLanguages(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getCurrencies = async () => {
  const response = await handle(`${serverUrl}/currencies`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 200) {
    const valid = validateCurrencies(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getCountries = async () => {
  const response = await handle(`${serverUrl}/countries`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 200) {
    const valid = validateCountries(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getProfile = async ({ userId, accessToken }) => {
  const response = await handle(`${serverUrl}/profiles/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateProfile(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getProfileHistory = async ({ userId, accessToken }) => {
  const response = await handle(
    `${serverUrl}/profiles/${userId}/historical-data`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateProfileHistory(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getAccount = async ({ userId, accessToken }) => {
  const response = await handle(`${serverUrl}/accounts/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateAccount(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const createNewPost = async ({ accessToken, data }) => {
  const response = await handle(`${serverUrl}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateSinglePost(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const updateAccount = async ({ userId, accessToken, data }) => {
  const response = await handle(`${serverUrl}/accounts/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateAccount(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const createNewComment = async ({ accessToken, data }) => {
  const response = await handle(`${serverUrl}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateSingleComment(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getPostComments = async ({ uuid, accessToken }) => {
  const response = await handle(`${serverUrl}/posts/${uuid}/comments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validatePostComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const createNewReply = async ({ accessToken, data }) => {
  const response = await handle(`${serverUrl}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateSingleReply(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const updateComment = async ({ accessToken, uuid, data }) => {
  const response = await handle(`${serverUrl}/comments/${uuid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateSingleComment(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const updateReply = async ({ accessToken, uuid, data }) => {
  const response = await handle(`${serverUrl}/replies/${uuid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateSingleReply(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const removeComment = async ({ accessToken, uuid }) => {
  const response = await handle(`${serverUrl}/comments/${uuid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
};

export const removeReply = async ({ accessToken, uuid }) => {
  const response = await handle(`${serverUrl}/replies/${uuid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
};

export const undeleteReply = async ({ accessToken, uuid }) => {
  const response = await handle(`${serverUrl}/replies/${uuid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateSingleReply(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const searchPosts = async ({ accessToken, data }) => {
  const response = await handle(`${searchUrl}/search/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validatePostSearchResponse(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getPeople = async ({ accessToken, data }) => {
  const response = await handle(`${serverUrl}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    const valid = validateGetPeople(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getAllUsersPosts = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/all-posts/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfPosts(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersActivePosts = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/active-posts/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfPosts(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersSoldPosts = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/sold-posts/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfPosts(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersDeletedPosts = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/deleted-posts/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfPosts(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersDraftPosts = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/draft-posts/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfPosts(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getAllUsersComments = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/all-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersOpenComments = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/open-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersHitComments = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/hit-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersDeletedComments = async ({
  accessToken,
  userId,
  page,
}) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/deleted-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersMissedComments = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/missed-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getUsersLostComments = async ({ accessToken, userId, page }) => {
  const response = await handle(
    `${serverUrl}/users/${userId}/lost-comments/${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 200) {
    const valid = validateListOfComments(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};
