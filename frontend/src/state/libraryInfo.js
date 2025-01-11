import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

const libraryUuidAtom = atom("");
const libraryNameAtom = atom("");
const libraryMaximumRentalPeriodAtom = atom(0);
const libraryMaximumFutureAtom = atom(0);

export const useLibraryInfo = () => {
  const [uuid, setUuid] = useAtom(libraryUuidAtom);
  const [name, setName] = useAtom(libraryNameAtom);
  const [maximumRentalPeriod, setMaximumRentalPeriod] = useAtom(
    libraryMaximumRentalPeriodAtom,
  ); // hours that rentals can be checked out for
  const [maximumFuture, setMaximumFuture] = useAtom(libraryMaximumFutureAtom); // days in the future that rentals can be made

  const { data, error, isLoading, mutate } = useSWR(
    "get library information",
    endpoints.getLibraryInformation,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (data) {
      setUuid(data.uuid);
      setName(data.name);
      setMaximumRentalPeriod(data.maximumRentalPeriod);
      setMaximumFuture(data.maximumFuture);
    }
  }, [data]);

  return {
    error,
    isLoading,
    refresh: () => mutate(),
    uuid,
    name,
    maximumRentalPeriod,
    maximumFuture,
  };
};
