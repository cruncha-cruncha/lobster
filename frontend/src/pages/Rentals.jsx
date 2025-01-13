import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "../state/auth";
import * as endpoints from "../api/endpoints";
import { useNavigate, useSearchParams } from "react-router";
import { useConstants } from "../state/constants";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { SearchSelect } from "../components/SearchSelect";
import { Checkbox } from "../components/Checkbox";
import { URL_STORE_ID_KEY } from "./Store";
import { useToolCategories } from "../state/toolCategories";
import { PrevNext } from "../components/PrevNext";
import { Button } from "../components/Button";
import { useToolCart } from "../state/toolCart";

export const Rentals = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // simple store search
  // user search
  // tool search

  // rental still open
  // rental overdue
  // start or end date range
  // sort by start date or end date 
  // sort order

  // page

  return (
    <div>
      <h1>Rentals</h1>
    </div>
  );
};
