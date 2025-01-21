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
  validateExactRealTool,
  validateToolSearchResults,
  validateToolCategorySearchResults,
  validateToolCategory,
  validateSingleRental,
  validateRentalWithText,
  validateRentalSearchResults,
  validateSingleGrievance,
  validateGrievanceWithNames,
  validateGrievanceSearchResults,
  validateGrievanceReplyWithNames,
  validateGrievanceReplies,
  validateErrorResponse,
  validatePhotoUploadResponse,
} from "./schemas";
import { ApiError } from "./ApiError";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3000";

const handle = (url, params) => {
  return (
    fetch(url, params)
      // .then(async (res) => {
      //   // simulate network latency
      //   await new Promise((resolve) => setTimeout(resolve, 1000));
      //   return res;
      // })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(JSON.stringify(await res.json()));
        }

        return res.json();
      })
      .catch((e) => {
        const message = e.message;
        let parsed = null;
        try {
          parsed = JSON.parse(message);
        } catch (_) {
          // ignore it
        }

        if (parsed !== null && validateErrorResponse(parsed)) {
          throw new ApiError(parsed);
        }

        console.error(e);
        throw new ApiError({
          status: 500,
          errCode: "ERR_UNKNOWN",
          details: message,
        });
      })
  );
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

export const searchUsers = async ({ params, accessToken }) => {
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

export const searchStores = async ({ params, accessToken }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/stores?${str_params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateStoreSearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getStore = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/stores/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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

export const getExactRealTool = async ({ params }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/tools/exact-real-id?${str_params}`, {
    method: "GET",
  });

  if (!validateExactRealTool(data)) {
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
};

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

export const createGrievance = async ({ info, accessToken }) => {
  const data = await handle(`${serverUrl}/grievances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateSingleGrievance(data)) {
    throw new Error(400);
  }

  return data;
};

export const searchGrievances = async ({ params, accessToken }) => {
  const str_params = obj_to_query(params);

  const data = await handle(`${serverUrl}/grievances?${str_params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateGrievanceSearchResults(data)) {
    throw new Error(400);
  }

  return data;
};

export const getGrievance = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/grievances/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!validateGrievanceWithNames(data)) {
    throw new Error(400);
  }

  return data;
};

export const updateGrievanceStatus = async ({ id, status, accessToken }) => {
  const data = await handle(`${serverUrl}/grievances/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!validateSingleGrievance(data)) {
    throw new Error(400);
  }

  return data;
};

export const createGrievanceReply = async ({
  grievanceId,
  info,
  accessToken,
}) => {
  const data = await handle(`${serverUrl}/grievances/${grievanceId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(info),
  });

  if (!validateGrievanceReplyWithNames(data)) {
    throw new Error(400);
  }

  return data;
};

export const getGrievanceReplies = async ({
  grievanceId,
  params,
  accessToken,
}) => {
  const str_params = obj_to_query(params);

  const data = await handle(
    `${serverUrl}/grievances/${grievanceId}/replies?${str_params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!validateGrievanceReplies(data)) {
    throw new Error(400);
  }

  return data;
};

export const uploadPhoto = async ({ file, accessToken }) => {
  const formData = new FormData();
  formData.append("file", file);

  const data = await handle(`${serverUrl}/photos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!validatePhotoUploadResponse(data)) {
    throw new Error(400);
  }

  return data;
};

export const deletePhoto = async ({ id, accessToken }) => {
  const data = await handle(`${serverUrl}/photos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const downloadPhoto = async ({ id, accessToken }) => {
  return fetch(`${serverUrl}/photos/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const downloadThumbnail = async ({ id, accessToken }) => {
  return fetch(`${serverUrl}/photos/${id}/thumb`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
