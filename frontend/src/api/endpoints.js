import {
  validateTokens,
  validateRefreshedTokens,
  validateLibraryInformation,
  validateStatusOptions,
  validateRoleOptions,
  validateUserInfo,
  validateFilteredUsers,
} from "./schemas";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3000";
const searchUrl = import.meta.env.VITE_SEARCH_URL || "http://127.0.0.1:3001";

const handle = (url, params) => {
  return fetch(url, params)
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.status);
      }

      return res.json();
    })
    .catch((e) => {
      const message = e.message;
      if (message.length === 3 && parseInt(message, 10) !== NaN) {
        throw new Error(parseInt(message, 10));
      } else {
        console.error(e);
        throw new Error(500);
      }
    });
};

const obj_to_query = (obj) => {
  return new URLSearchParams(obj).toString();
}

export const getLibraryInformation = async () => {
  const data = await handle(`${serverUrl}/library`, {
    method: "GET",
  });

  if (!validateLibraryInformation(data)) {
    throw new Error(400);
  }

  return data;
};

export const getAllStatusOptions = async () => {
  const data = await handle(`${serverUrl}/statuses`, {
    method: "GET",
  });

  if (!validateStatusOptions(data)) {
    throw new Error(400);
  }

  return data;
};

export const getRoleOptions = async () => {
  const data = await handle(`${serverUrl}/roles`, {
    method: "GET",
  });

  if (!validateRoleOptions(data)) {
    throw new Error(400);
  }

  return data;
};

export const createLibrary = async ({ name }) => {
  const data = await handle(`${serverUrl}/library`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return data;
};

export const updateLibrary = async ({
  name,
  maxRentalPeriod,
  maxFuture,
  accessToken,
}) => {
  const data = await handle(`${serverUrl}/library`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, maxRentalPeriod, maxFuture }),
  });

  return data;
};

export const login = async ({ email }) => {
  const data = await handle(`${serverUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!validateTokens(data)) {
    throw new Error(400);
  }

  return data;
};

export const refresh = async ({ refreshToken }) => {
  const data = await handle(`${serverUrl}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!validateRefreshedTokens(data)) {
    throw new Error(400);
  }

  return data;
};

export const getUsers = async ({ params, accessToken }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/users?${str_params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateFilteredUsers(data)) {
    throw new Error(400);
  }

  return data;
}

export const getUser = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/users/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateUserInfo(data)) {
    throw new Error(400);
  }

  return data;
}

export const updateUser = async ({ id, username, accessToken }) => {
  const data = await handle(`${serverUrl}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ username }),
  });

  return data;
}

export const updateUserStatus = async ({ id, status, accessToken }) => {
  const data = await handle(`${serverUrl}/users/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });

  return data;
}
