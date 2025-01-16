import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/Button";
import {
  DateTimeInput,
  formatDateForBackend,
  formatDateForInput,
} from "../components/DateTimeInput";

export const useRental = () => {
  const { accessToken, permissions } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [endDate, _setEndDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const rentalId = params.id;

  const { data, isLoading, error, mutate } = useSWR(
    !accessToken ? null : `get rental ${rentalId}, using ${accessToken}`,
    () => endpoints.getRental({ id: rentalId, accessToken }),
  );

  useEffect(() => {
    if (data) {
      _setEndDate(formatDateForInput(data.endDate));
    }
  }, [data]);

  const setEndDate = (e) => {
    _setEndDate(e.target.value);
  };

  const updateRental = () => {
    setIsUpdating(true);
    const formattedEndDate = formatDateForBackend(endDate);
    const info = {
      ...(!formattedEndDate ? {} : { endDate: formattedEndDate }),
      ...(!formattedEndDate ? { noEndDate: true } : {}),
    };

    return endpoints
      .updateRental({
        id: Number(rentalId),
        info,
        accessToken,
      })
      .then((data) => {
        mutate(prev => ({ ...prev, endDate: data.endDate }));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const goToStore = () => {
    navigate(`/stores/${data.storeId}`);
  };

  const goToTool = () => {
    navigate(`/tools/${data.toolId}`);
  };

  const goToPerson = () => {
    navigate(`/people/${data.renterId}`);
  };

  const goToRentals = () => {
    navigate("/rentals");
  };

  const showUpdateRental = permissions.isToolManager(data?.storeId);

  const canUpdateRental =
    !(!data?.endDate && !endDate) &&
    formatDateForBackend(endDate) != data?.endDate;

  return {
    data,
    goToStore,
    goToTool,
    goToPerson,
    goToRentals,
    endDate,
    setEndDate,
    updateRental,
    isUpdating,
    canUpdateRental,
    showUpdateRental,
  };
};

export const PureRental = (tool) => {
  const {
    data,
    goToStore,
    goToTool,
    goToPerson,
    goToRentals,
    endDate,
    setEndDate,
    updateRental,
    isUpdating,
    canUpdateRental,
    showUpdateRental,
  } = tool;

  return (
    <div>
      <div className="my-2 flex justify-start gap-2 px-2">
        <Button text="Rentals" onClick={goToRentals} variant="blue" size="sm" />
        <Button text="Tool" onClick={goToTool} variant="blue" size="sm" />
        <Button text="Store" onClick={goToStore} variant="blue" size="sm" />
        <Button text="Person" onClick={goToPerson} variant="blue" size="sm" />
      </div>
      <p className="px-2">{JSON.stringify(data)}</p>
      {showUpdateRental && (
        <>
          <div className="mb-3 mt-2 flex flex-col gap-x-4 gap-y-2 px-2 md:flex-row">
            <DateTimeInput
              id="rental-end-date"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2 px-2">
            <Button
              text="Update"
              onClick={updateRental}
              isLoading={isUpdating}
              disabled={!canUpdateRental}
            />
          </div>
        </>
      )}
    </div>
  );
};

export const Rental = () => {
  const tool = useRental();
  return <PureRental {...tool} />;
};
