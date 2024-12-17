import {
  useReducer,
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useNavigate } from "react-router";
import { atom, useAtom } from "jotai";
import useSWR from "swr";
import { jwtDecode } from "jwt-decode";

import * as endpoints from "../api/endpoints";

const userIdAtom = atom("");
const userPermissionsAtom = atom([]);
const accessTokenAtom = atom("");
const refreshTokenAtom = atom("");

export const useSetupAuth = () => {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [refreshToken, setRefreshToken] = useAtom(refreshTokenAtom);
  const { refresh } = useAuth({ mustBeLoggedIn: false });

  // try to login on load
  useEffect(() => {
    const refreshToken = localStorage?.getItem?.("refreshToken");

    if (refreshToken) {
      refresh(refreshToken);
      setRefreshToken(refreshToken);
    }
  }, []);

  // keep local storage in sync with state
  useEffect(() => {
    localStorage?.setItem?.("accessToken", accessToken);
    localStorage?.setItem?.("refreshToken", refreshToken);
  }, [accessToken, refreshToken]);

  // automatically refresh the access token every 15 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (refreshToken) {
          refresh(refreshToken);
        }
      },
      15 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [refreshToken]);
};

export const useAuth = ({ mustBeLoggedIn = true } = {}) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useAtom(userIdAtom);
  const [permissions, setPermissions] = useAtom(userPermissionsAtom);
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [refreshToken, setRefreshToken] = useAtom(refreshTokenAtom);

  const isLoggedIn = !!userId && !!accessToken;
  if (!isLoggedIn && mustBeLoggedIn) {
    navigate("/login");
  }

  const login = useCallback(({ email }) => {
    endpoints
      .login({ email })
      .then((res) => {
        if (res.status === 200) {
          setAccessToken(res.data.access_token);
          setRefreshToken(res.data.refresh_token);
          const decoded = jwtDecode(res.data.access_token);
          setUserId(decoded.user_id);
          setPermissions(decoded.permissions);
        } else {
          console.error(res.status, res);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  const refresh = useCallback((refreshToken) => {
    endpoints
      .refresh({ refresh_token: refreshToken })
      .then((res) => {
        if (res.status === 200) {
          setAccessToken(res.data.access_token);
          const decoded = jwtDecode(res.data.access_token);
          setUserId(decoded.user_id);
          setPermissions(decoded.permissions);
        } else {
          console.error(res.status, res);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  const logout = useCallback(() => {
    setUserId("");
    setPermissions([]);
    setAccessToken("");
    setRefreshToken("");
  }, []);

  return {
    userId,
    permissions,
    accessToken,
    refreshToken,
    isLoggedIn,
    login,
    refresh,
    logout,
  };
};
