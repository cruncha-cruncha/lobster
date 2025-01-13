import {
  validateTokens,
  validateRefreshedTokens,
  validateLibraryInformation,
  validateStatusOptions,
  validateRoleOptions,
  validateUserInfo,
  validateFilteredUsers,
  validateStoreInfo,
  validateStoreSearchResults,
  validateUserPermissions,
  validateSinglePermission,
  validateSingleTool,
  validateToolSearchResults,
  validateToolCategorySearchResults,
  validateToolCategory,
  validateSingleRental,
  validateRentalWithText,
  validateRentalSearchResults,
} from "./schemas";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3000";

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
  const params = [];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      }
    } else {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return params.join("&");
};

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

export const updateLibrary = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/library`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
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
};

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
};

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
};

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
};

export const createStore = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateStoreInfo(data)) {
    throw new Error(400);
  }

  return data;
};

export const updateStore = async ({ id, info, accessToken }) => {
  const data = await handle(`${serverUrl}/stores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateStoreInfo(data)) {
    throw new Error(400);
  }

  return data;
};

export const updateStoreStatus = async ({ id, status, accessToken }) => {
  const data = await handle(`${serverUrl}/stores/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!validateStoreInfo(data)) {
    throw new Error(400);
  }

  return data;
};

export const searchStores = async ({ params }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/stores?${str_params}`, {
    method: "GET",
  });

  if (!validateStoreSearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getStore = async ({ id }) => {
  const data = await handle(`${serverUrl}/stores/${id}`, {
    method: "GET",
  });

  if (!validateStoreInfo(data)) {
    throw new Error(400);
  }

  return data;
};

export const getUserPermissions = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/users/${id}/permissions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateUserPermissions(data)) {
    throw new Error(400);
  }

  return data;
};

export const addUserPermission = async ({ permission, accessToken }) => {
  const data = await handle(`${serverUrl}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(permission),
  });

  if (!validateSinglePermission(data)) {
    throw new Error(400);
  }

  return data;
};

export const removeUserPermission = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/permissions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const createTool = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateSingleTool(data)) {
    throw new Error(400);
  }

  return data;
};

export const updateTool = async ({ id, info, accessToken }) => {
  const data = await handle(`${serverUrl}/tools/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateSingleTool(data)) {
    throw new Error(400);
  }

  return data;
};

export const getTool = async ({ id }) => {
  const data = await handle(`${serverUrl}/tools/${id}`, {
    method: "GET",
  });

  if (!validateSingleTool(data)) {
    throw new Error(400);
  }

  return data;
};

export const searchTools = async ({ params }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/tools?${str_params}`, {
    method: "GET",
  });

  if (!validateToolSearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getAllToolCategories = async () => {
  const data = await handle(`${serverUrl}/tool-categories/all`, {
    method: "GET",
  });

  if (!validateToolCategorySearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getToolCategory = async ({ id }) => {
  const data = await handle(`${serverUrl}/tool-categories/${id}`, {
    method: "GET",
  });

  if (!validateToolCategory(data)) {
    throw new Error(400);
  }

  return data;
};

export const searchToolCategories = async ({ params }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/tool-categories?${str_params}`, {
    method: "GET",
  });

  if (!validateToolCategorySearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getRental = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/rentals/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateRentalWithText(data)) {
    throw new Error(400);
  }

  return data;
};

export const updateRental = async ({ id, info, accessToken }) => {
  const data = await handle(`${serverUrl}/rentals/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateSingleRental(data)) {
    throw new Error(400);
  }

  return data;
}

export const searchRentals = async ({ params, accessToken }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/rentals?${str_params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateRentalSearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const checkInTools = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/rentals/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  return data;
};

export const checkOutTools = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/rentals/check-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  return data;
};
