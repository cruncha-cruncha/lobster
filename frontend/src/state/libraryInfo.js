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
  ); // hours that rentals can be checked out for
  const [maxFuture, setMaxFuture] = useAtom(libraryMaxFutureAtom); // days in the future that rentals can be made

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

  const refresh = () => {
    return endpoints.getLibraryInformation().then((data) => {
      setUuid(data.uuid);
      setName(data.name);
      setMaxRentalPeriod(data.maxRentalPeriod);
      setMaxFuture(data.maxFuture);
    });
  };

  return {
    error,
    isLoading,
    refresh,
    uuid,
    name,
    maxRentalPeriod,
    maxFuture,
  };
};
