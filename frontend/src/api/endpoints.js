import {
  validateTokens,
  validateRefreshAccessToken,
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
} from "./schemas";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3000";

const handle = (url, params) => {
  return fetch(url, params)
    .then((res) => {
      if (!res.ok) {
        return {
          status: res.status,
          data: null,
        };
      }

      return res
        .json()
        .then((data) => {
          return {
            status: res.status,
            data: data,
          };
        })
        .catch(() => {
          return {
            status: res.status,
            data: null,
          };
        });
    })
    .catch(() => {
      // unrecoverable
      return {
        status: null,
        data: null,
      };
    });
};

export const login = async ({ email, password }) => {
  const response = await handle(`${serverUrl}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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
    const valid = validateRefreshAccessToken(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getPost = async ({ postUuid, accessToken }) => {
  const response = await handle(`${serverUrl}/posts/${postUuid}`, {
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

export const getUnreadActivity = async ({ userId, accessToken }) => {
  const response = await handle(`${serverUrl}/unread-activity/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateUnreadActivity(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
};

export const getProfileHistory = async ({ userId, accessToken }) => {
  const response = await handle(`${serverUrl}/profiles/${userId}/historical-data`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    const valid = validateProfileHistory(response.data);
    if (!valid) return { status: null, data: null };
  }

  return response;
}

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
}

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
}

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
}

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
}

export const getPostComments = async ({ postUuid, accessToken }) => {
  const response = await handle(`${serverUrl}/posts/${postUuid}/comments`, {
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
}

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
}

export const updateComment = async ({ accessToken, commentUuid, data }) => {
  const response = await handle(`${serverUrl}/comments/${commentUuid}`, {
    method: "PUT",
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
}

export const updateReply = async ({ accessToken, replyUuid, data }) => {
  const response = await handle(`${serverUrl}/replies/${replyUuid}`, {
    method: "PUT",
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
}

export const removeComment = async ({ accessToken, commentUuid }) => {
  const response = await handle(`${serverUrl}/comments/${commentUuid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}

export const removeReply = async ({ accessToken, replyUuid }) => {
  const response = await handle(`${serverUrl}/replies/${replyUuid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}

export const undeleteReply = async ({ accessToken, replyUuid }) => {
  const response = await handle(`${serverUrl}/replies/${replyUuid}`, {
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
}