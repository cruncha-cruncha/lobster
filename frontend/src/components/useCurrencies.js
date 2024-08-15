import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import * as endpoints from "../api/endpoints";

const currenciesAtom = atom([]);

export const loadCurrencies = () => {
  const [_, setValue] = useAtom(currenciesAtom);

  useEffect(() => {
    endpoints.getCurrencies().then((res) => {
      if (res.status === 200) {
        setValue(res.data);
      }
    });
  }, []);
};

export const useCurrencies = () => {
  const [value, _] = useAtom(currenciesAtom);

  return {
    currencies: value,
  };
};
