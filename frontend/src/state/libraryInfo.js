import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import useSWR from "swr";
import * as endpoints from "../api/endpoints";

const libraryUuidAtom = atom("");
const libraryNameAtom = atom("");
const libraryMaximumRentalHoursAtom = atom(0);

export const useLibraryInfo = () => {
  const [uuid, setUuid] = useAtom(libraryUuidAtom);
  const [name, setName] = useAtom(libraryNameAtom);
  const [maximumRentalHours, setMaximumRentalHours] = useAtom(
    libraryMaximumRentalHoursAtom,
  ); // hours that rentals can be checked out for

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
      setMaximumRentalHours(data.maximumRentalHours);
    }
  }, [data]);

  return {
    error,
    isLoading,
    refresh: () => mutate(),
    uuid,
    name,
    maximumRentalHours,
  };
};
