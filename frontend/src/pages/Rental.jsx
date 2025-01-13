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
  const { accessToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [endDate, _setEndDate] = useState("");
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
    const formattedEndDate = formatDateForBackend(endDate);
    const info = {
      endDate: formattedEndDate,
      ...(!formattedEndDate ? { noEndDate: true } : {}),
    };

    return endpoints
      .updateRental({
        id: Number(rentalId),
        info,
        accessToken,
      })
      .then(() => {
        mutate();
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

  return {
    data,
    goToStore,
    goToTool,
    goToPerson,
    goToRentals,
    endDate,
    setEndDate,
    updateRental,
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
  } = tool;

  return (
    <div>
      <p>Rental</p>
      <div className="flex gap-2">
        <Button text="Tool" onClick={goToTool} variant="blue" />
        <Button text="Store" onClick={goToStore} variant="blue" />
        <Button text="Person" onClick={goToPerson} variant="blue" />
        <Button text="Rentals" onClick={goToRentals} variant="blue" />
      </div>
      <p>{JSON.stringify(data)}</p>
      <DateTimeInput label="End Date" value={endDate} onChange={setEndDate} />
      <Button text="Update" onClick={updateRental} />
    </div>
  );
};

export const Rental = () => {
  const tool = useRental();
  return <PureRental {...tool} />;
};
