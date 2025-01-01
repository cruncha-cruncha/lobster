import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { atom, useAtom } from "jotai";
import { jwtDecode } from "jwt-decode";

import * as endpoints from "../api/endpoints";

const userIdAtom = atom(0);
const userPermissionsAtom = atom([]);
const accessTokenAtom = atom("");
const refreshTokenAtom = atom("");
const attemptingRefreshAtom = atom(true);

export const useSetupAuth = () => {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [refreshToken, setRefreshToken] = useAtom(refreshTokenAtom);
  const [attemptingRefresh, setAttemptingRefresh] = useAtom(attemptingRefreshAtom);
  const { refresh } = useAuth();

  // try to login on load
  useEffect(() => {
    const refreshToken = localStorage?.getItem?.("refreshToken");

    if (refreshToken) {
      refresh(refreshToken);
      setRefreshToken(refreshToken);
    } else {
      setAttemptingRefresh(false);
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

export const useAuth = ({ mustBeLoggedIn = false } = {}) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useAtom(userIdAtom);
  const [permissions, setPermissions] = useAtom(userPermissionsAtom);
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [refreshToken, setRefreshToken] = useAtom(refreshTokenAtom);
  const [attemptingRefresh, setAttemptingRefresh] = useAtom(attemptingRefreshAtom);

  const isLoggedIn = !!userId && !!accessToken;
  if (!isLoggedIn && !attemptingRefresh && mustBeLoggedIn) {
    navigate("/login");
  }

  const login = useCallback(({ email }) => {
    return endpoints.login({ email }).then((data) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      const decoded = jwtDecode(data.accessToken);
      setUserId(parseInt(decoded.sub, 10));
      setPermissions(decoded.permissions);
    });
  }, []);

  const refresh = useCallback((refreshToken) => {
    setAttemptingRefresh(true);
    return endpoints
      .refresh({ refreshToken })
      .then((data) => {
        setAccessToken(data.accessToken);
        const decoded = jwtDecode(data.accessToken);
        setUserId(parseInt(decoded.sub, 10));
        setPermissions(decoded.permissions);
      })
      .catch((e) => {
        setAccessToken("");
        setRefreshToken("");
        setUserId("");
        setPermissions([]);
        throw e;
      })
      .finally(() => {
        setAttemptingRefresh(false);
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
    attemptingRefresh,
    login,
    refresh,
    logout,
  };
};
