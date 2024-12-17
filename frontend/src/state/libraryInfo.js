import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

const libraryUuidAtom = atom("");
const libraryNameAtom = atom("");
const libraryMaxRentalPeriodAtom = atom(0);
const libraryMaxFutureAtom = atom(0);

export const useLibraryInfo = () => {
  const [uuid, setUuid] = useAtom(libraryUuidAtom);
  const [name, setName] = useAtom(libraryNameAtom);
  const [maxRentalPeriod, setMaxRentalPeriod] = useAtom(
    libraryMaxRentalPeriodAtom,
  );
  const [maxFuture, setMaxFuture] = useAtom(libraryMaxFutureAtom);

  const { error, isLoading } = useSWR(
    "get library information",
    endpoints.getLibraryInformation,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        setUuid(data.uuid);
        setName(data.name);
        setMaxRentalPeriod(data.maxRentalPeriod);
        setMaxFuture(data.maxFuture);
      },
    },
  );

  return {
    error,
    isLoading,
    get: {
      uuid,
      name,
      maxRentalPeriod,
      maxFuture,
    },
    set: {
      uuid: setUuid,
      name: setName,
      maxRentalPeriod: setMaxRentalPeriod,
      maxFuture: setMaxFuture,
    },
  };
};
