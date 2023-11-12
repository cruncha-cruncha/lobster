import { validateTokens, validateRefreshAccessToken, validateGetPost } from "./schemas";

const serverUrl = "http://127.0.0.1:3000";

const handle = (url, params) => {
  return fetch(url, params)
    .then((res) => {
      if (!res.ok) {
        return {
          status: res.status,
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
          };
        });
    })
    .catch(() => {
      // unrecoverable
      return null;
    });
};

export const login = async ({ email, password }) => {
  const response = await handle(serverUrl + "/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response || response?.status !== 200) return null;
  const valid = validateTokens(response?.data);
  if (!valid) return null;
  return response?.data;
};

export const requestInvitation = async ({ email }) => {
  const response = await handle(serverUrl + "/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response || response?.status !== 200) return null;
  return true;
}

export const acceptInvitation = async ({
  code,
  email,
  name,
  password,
  language,
}) => {
  const response = await handle(serverUrl + `/invitations/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name,
      password,
      language: Number(language),
    }),
  });

  if (!response || response?.status !== 200) return null;

  const valid = validate(response?.data);
  if (!valid) return null;
  return response.data;
};

export const requestPasswordReset = async ({ email }) => {
  const response = await handle(serverUrl + "/password-resets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response || response?.status !== 200) return null;
  return true;
}

export const resetPassword = async ({ code, email, password }) => {
  const response = await handle(serverUrl + `/password-resets/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response || response?.status !== 200) return null;
  return true;
}

export const refreshAccessToken = async ({ refreshToken }) => {
  const response = await handle(serverUrl + "/tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!response || response?.status !== 200) return null;

  const valid = validateRefreshAccessToken(response?.data);
  if (!valid) return null;
  return response.data;
};

export const getPost = async ({ postUuid, accessToken }) => {
  const response = await handle(serverUrl + `/posts/${postUuid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response || response?.status !== 200) return null;
  const valid = validateGetPost(response?.data);
  if (!valid) return null;
  return response.data;
}
