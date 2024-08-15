import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import * as endpoints from "../api/endpoints";

const languagesAtom = atom([]);

export const loadLanguages = () => {
  const [_, setValue] = useAtom(languagesAtom);

  useEffect(() => {
    endpoints.getLanguages().then((res) => {
      if (res.status === 200) {
        setValue(res.data);
      }
    });
  }, []);
};

export const useLanguages = () => {
  const [value, _] = useAtom(languagesAtom);

  return {
    languages: value,
  };
};
