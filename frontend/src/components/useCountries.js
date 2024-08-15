import { useEffect } from "react";
import { atom, useSetAtom, useAtomValue } from "jotai";
import * as endpoints from "../api/endpoints";

const countriesAtom = atom([]);

export const loadCountries = () => {
  const setValue = useSetAtom(countriesAtom);

  useEffect(() => {
    endpoints.getCountries().then((res) => {
      if (res.status === 200) {
        setValue(res.data);
      }
    });
  }, []);
};

export const useCountries = () => {
  const value = useAtomValue(countriesAtom);

  return {
    countries: value,
  };
};
