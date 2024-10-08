import { useState, useEffect, useMemo, useRef } from "react";
import { Map, ZoomControl, GeoJson } from "pigeon-maps";
import * as endpoints from "../../api/endpoints";
import { useAuth } from "../../components/userAuth";
import { Slider, RangeSlider } from "../../components/Slider";
import { circleToPolygon } from "./circletopolygon";
import { useInfoModal } from "../../components/InfoModal";
import { LRU } from "./LRU";

export const GET_PAGE_SIZE = () => 20;

const initialState = {
  page: 0, // page
  term: "", // term
  countries: [1], // co[]
  sort: 0, // sort
  location: {
    on: false, // loc-on
    longitude: 0, // loc-lon
    latitude: 0, // loc-lat
    radius: 0.74, // loc-r
    zoom: 3, // loc-z
  },
  priceRange: {
    on: false, // pr-on
    low: 0, // pr-lo
    high: 10, // pr-hi
  },
  noPrice: {
    only: false, // np-only
    exclude: false, // np-exclude
  },
};

const asInt = (val, fallback) => {
  const i = parseInt(val);
  return isNaN(i) ? fallback : i;
};

const asFloat = (val, fallback) => {
  const f = parseFloat(val);
  return isNaN(f) ? fallback : f;
};

const asBool = (val, fallback) => {
  return val == null ? fallback : val === "true" ? true : false;
};

export const formatData = (data) => {
  if (!data) return null;

  return {
    uuid: data.uuid,
    authorId: data.author_id,
    title: data.title,
    content: data.content,
    images: data.images,
    price: data.price,
    currency: data.currency,
    country: data.country,
    latitude: data.location.lat,
    longitude: data.location.lon,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    commentCount: data.comment_count,
  };
};

export const useSearch = () => {
  const auth = useAuth();
  const modal = useInfoModal();

  const [state, setState] = useState(initialState);
  const [flipFlop, setFlipFlop] = useState(false);
  const [ready, setReady] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const nameCache = useMemo(() => new LRU(1000), []);

  const mainTextInputRef = useRef(null);

  const updateParam = (key, value) => {
    const searchParams = new URLSearchParams(window.location.search);

    if (Array.isArray(value)) {
      const arrKey = key + "[]";
      searchParams.delete(arrKey);
      value.forEach((v) => searchParams.append(arrKey, v));
    } else {
      searchParams.set(key, value);
    }

    const url =
      window.location.origin +
      window.location.pathname +
      "?" +
      searchParams.toString();
    window.history.pushState({}, "", url);

    setFlipFlop(!flipFlop);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);

    const page = queryParams.get("page");
    const term = queryParams.get("term");
    const countries = (queryParams.getAll("co[]") || []).map((c) => Number(c));
    const sort = queryParams.get("sort");
    const locationOn = queryParams.get("loc-on");
    const locationLongitude = queryParams.get("loc-lon");
    const locationLatitude = queryParams.get("loc-lat");
    const locationRadius = queryParams.get("loc-r");
    const locationZoom = queryParams.get("loc-z");
    const priceRangeOn = queryParams.get("pr-on");
    const priceRangeLow = queryParams.get("pr-lo");
    const priceRangeHigh = queryParams.get("pr-hi");
    const noPriceOnly = queryParams.get("np-only");
    const noPriceExclude = queryParams.get("np-exclude");

    setState((prev) => {
      // sanitize numeric values
      let srt = asInt(sort, prev.sort);
      if (srt < 0 || srt > 4) srt = prev.sort;
      let locLon = asFloat(locationLongitude, prev.location.longitude);
      if (locLon < -180 || locLon > 180) locLon = prev.location.longitude;
      let locLat = asFloat(locationLatitude, prev.location.latitude);
      if (locLat < -90 || locLat > 90) locLat = prev.location.latitude;
      let locR = asFloat(locationRadius, prev.location.radius);
      if (locR < 0 || locR > 3) locR = prev.location.radius;
      let locZ = asInt(locationZoom, prev.location.zoom);
      if (locZ < 3 || locZ > 14) locZ = prev.location.zoom;
      let prlo = asFloat(priceRangeLow, prev.priceRange.low);
      if (prlo < 0 || prlo > 60) prlo = prev.priceRange.low;
      let prhi = asFloat(priceRangeHigh, prev.priceRange.high);
      if (prhi < 0 || prhi > 60) prhi = prev.priceRange.high;
      if (prlo > prhi) {
        const tmp = prlo;
        prlo = prhi;
        prhi = tmp;
      }

      // sanitize logical values
      let prOn = asBool(priceRangeOn, prev.priceRange.on);
      let npOnly = asBool(noPriceOnly, prev.noPrice.only);
      let npExclude = asBool(noPriceExclude, prev.noPrice.exclude);
      if (npOnly) {
        prOn = false;
        npExclude = false;
      }

      const out = {
        page: asInt(page, prev.page),
        term: typeof term === "string" ? term : prev.term,
        countries: countries.length > 0 ? countries : prev.countries,
        sort: srt,
        location: {
          on: asBool(locationOn, prev.location.on),
          longitude: locLon,
          latitude: locLat,
          radius: locR,
          zoom: locZ,
        },
        priceRange: {
          on: prOn,
          low: prlo,
          high: prhi,
        },
        noPrice: {
          only: npOnly,
          exclude: npExclude,
        },
      };

      return out;
    });

    setReady(true);
  }, [window.location.search]);

  const onSearch = (page) => {
    setIsLoading(true);
    setCollapsed(true);

    const onErr = () => {
      setCollapsed(false);
      modal.open("Search failed. Please try again later.", "error");
    };

    const numPage = Number(page);
    const offset = !isNaN(numPage)
      ? numPage * GET_PAGE_SIZE()
      : state.page * GET_PAGE_SIZE();

    endpoints
      .searchPosts({
        accessToken: auth.accessToken,
        data: {
          full: true,
          offset,
          limit: GET_PAGE_SIZE(),
          sort_by: state.sort,
          term: state.term,
          countries: state.countries,
          location: {
            valid: state.location.on,
            latitude: state.location.latitude,
            longitude: state.location.longitude,
            radius: state.location.radius,
          },
          no_price: {
            only: state.noPrice.only,
            exclude: state.noPrice.exclude,
          },
          price_range: {
            valid: state.priceRange.on,
            min: state.priceRange.low,
            max: state.priceRange.high,
          },
        },
      })
      .then((res) => {
        if (res.status === 200) {
          const found = res.data.found.map((d) => formatData(d));
          const authorIds = found.map((post) => post.authorId);
          kickAuthors(authorIds);
          setResults(found);
        } else {
          console.error(res.status, res);
          onErr();
        }
      })
      .catch((e) => {
        console.error(e);
        onErr();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const kickAuthors = (ids) => {
    endpoints
      .getPeople({
        accessToken: auth.accessToken,
        data: {
          ids,
        },
      })
      .then((res) => {
        if (res.status === 200) {
          res.data.people.forEach((person) => {
            nameCache.put(person.id, person.name);
          });

          setResults((prev) =>
            prev.map((post) => ({
              ...post,
              authorName: nameCache.get(post.authorId),
            })),
          );
        } else {
          console.error(res.status, res);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const calcRadius = (radius) => {
    const pow = Math.pow(10, radius) - 0.5;
    switch (true) {
      case pow < 10:
        return Math.round(pow * 10) / 10;
      case pow < 100:
        return Math.round(pow);
      case pow < 1000:
        return Math.round(pow / 10) * 10;
      default:
        return Math.round(pow / 100) * 100;
    }
  };

  const calcPriceRange = (val) => {
    switch (true) {
      case val < 20:
        return Math.round(val) * 5;
      case val < 40:
        return Math.round(((val - 20) * 45 + 100) / 10) * 10;
      default:
        return Math.round(((val - 40) * 450 + 1000) / 50) * 50;
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      mainTextInputRef.current?.blur();
      onSearch(0);
    }
  };

  return {
    ...state,
    ready,
    results,
    modal,
    isLoading,
    collapsed,
    setCollapsed,
    priceSliderMin: 0,
    priceSliderMax: 60,
    radiusSliderMin: 0,
    radiusSliderMax: 3,
    maxZoom: 14,
    minZoom: 3,
    initialLocation: { lat: 50.879, lon: 4.6997 },
    mainTextInputRef,
    onSearch,
    handleKeyUp,
    calcRadius,
    calcPriceRange,
    setPage: (num) => updateParam("page", num),
    setTerm: (e) => updateParam("term", e.target.value),
    setCountries: (e) => {
      const arr = Object.values(e.target.selectedOptions).map(({ value }) =>
        Number(value),
      );
      setState((prev) => ({ ...prev, countries: arr }));
      updateParam("co", arr);
    },
    setSort: (e) => updateParam("sort", e.target.value),
    setLocation: (e) => {
      updateParam("loc-lat", e.lat);
      updateParam("loc-lon", e.lon);
    },
    setLocationValid: (checked) => updateParam("loc-on", checked),
    finalizeRadius: (val) => updateParam("loc-r", val),
    tmpSetRadius: (val) => {
      setState((prev) => ({
        ...prev,
        location: { ...prev.location, radius: val },
      }));
    },
    setZoom: (val) => updateParam("loc-z", val),
    setPriceRangeValid: (checked) => {
      if (checked) {
        updateParam("pr-on", true);
        updateParam("np-only", false);
      } else {
        updateParam("pr-on", false);
      }
    },
    finalizePriceRange: (range) => {
      updateParam("pr-lo", range[0]);
      updateParam("pr-hi", range[1]);
    },
    tmpSetPriceRange: (range) => {
      setState((prev) => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          low: range[0],
          high: range[1],
        },
      }));
    },
    setNoPriceOnly: (checked) => {
      if (checked) {
        updateParam("np-only", true);
        updateParam("np-exclude", false);
        updateParam("pr-on", false);
      } else {
        updateParam("np-only", false);
      }
    },
    setNeedPrice: (checked) => {
      if (checked) {
        updateParam("np-exclude", true);
        updateParam("np-only", false);
      } else {
        updateParam("np-exclude", false);
      }
    },
  };
};

export const PureSearchForm = (search) => {
  return (
    <div onKeyUp={(e) => search?.handleKeyUp?.(e)}>
      <div className="m-2 mt-0 rounded-sm border-b-2 border-stone-800">
        <div className="relative flex items-center rounded-sm ring-sky-500 transition-shadow focus-within:ring-2">
          <input
            type="text"
            id="term"
            ref={search?.mainTextInputRef}
            placeholder="search"
            value={search?.term}
            onChange={(e) => search?.setTerm?.(e)}
            className="grow rounded-md py-1 pl-2 focus-visible:outline-none"
            onFocus={() => search?.setCollapsed?.(false)}
          />
          <div
            className="relative cursor-pointer"
            onClick={() => search?.setCollapsed?.((prev) => !prev)}
          >
            <div className="absolute -left-4 h-full w-4 bg-gradient-to-l from-white to-transparent" />
            <span className="text-md py-1 pl-1 pr-2 text-stone-500">
              {search?.collapsed ? <>&or;</> : <>&and;</>}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: search?.collapsed ? "0fr" : "1fr",
          transition: "grid-template-rows 0.5s ease-out",
        }}
      >
        <div className="overflow-hidden">
          <div
            className="p-2"
            onClick={() =>
              search?.setPriceRangeValid?.(!search?.priceRange?.on)
            }
          >
            <input
              readOnly // to please the linter
              type="checkbox"
              id="price-range-valid"
              checked={search?.priceRange?.on}
            />
            <p className="ml-2 inline-block">
              In price range{" "}
              <span className={search?.priceRange?.on ? "" : "hidden"}>
                [{search?.calcPriceRange?.(search?.priceRange?.low)},{" "}
                {search?.calcPriceRange?.(search?.priceRange?.high)}]
              </span>
            </p>
          </div>
          {search?.ready && (
            <div
              className={
                "overflow-hidden transition-max-height duration-500 ease-out" +
                (!search?.priceRange?.on ? " max-h-0" : " max-h-12")
              }
            >
              <div className="p-4 pt-3">
                <RangeSlider
                  id="price-range"
                  min={search?.priceSliderMin}
                  max={search?.priceSliderMax}
                  step={0.01}
                  disabled={!search?.priceRange?.on}
                  defaultValue={[
                    search?.priceRange?.low,
                    search?.priceRange?.high,
                  ]}
                  onChange={(range) => search?.tmpSetPriceRange?.(range)}
                  onChangeComplete={(range) =>
                    search?.finalizePriceRange?.(range)
                  }
                />
              </div>
            </div>
          )}
          <div className="flex flex-row flex-wrap">
            <div
              className="mr-2 p-2"
              onClick={() => search?.setNeedPrice?.(!search?.noPrice?.exclude)}
            >
              <input
                readOnly // for the linter
                type="checkbox"
                id="need-price"
                checked={search?.noPrice?.exclude}
              />
              <p className="ml-2 inline-block">Must have a price</p>
            </div>
            <div
              className="mr-2 p-2"
              onClick={() => search?.setNoPriceOnly?.(!search?.noPrice?.only)}
            >
              <input
                readOnly // for the linter
                type="checkbox"
                id="no-price-only"
                checked={search?.noPrice?.only}
              />
              <p className="ml-2 inline-block">No Price only</p>
            </div>
          </div>
          <div
            className="p-2 pb-0"
            onClick={() => search?.setLocationValid?.(!search?.location?.on)}
          >
            <input
              readOnly // for the linter
              type="checkbox"
              id="location-valid"
              checked={search?.location?.on}
            />
            <p className="ml-2 inline-block">With specific location</p>
          </div>
          {search?.ready && (
            <div
              className={
                "overflow-hidden transition-max-height duration-500 ease-in-out" +
                (!search?.location?.on ? " max-h-0" : " max-h-96")
              }
            >
              <div className="p-4">
                <Slider
                  id="radius"
                  min={search?.radiusSliderMin}
                  max={search?.radiusSliderMax}
                  step={0.01}
                  disabled={!search?.location?.on}
                  defaultValue={search?.location?.radius}
                  onChange={(val) => search?.tmpSetRadius?.(val)}
                  onChangeComplete={(val) => search?.finalizeRadius?.(val)}
                />
              </div>
              <CustomMap
                initialLocation={{
                  lat: search?.location?.latitude,
                  lon: search?.location?.longitude,
                }}
                initialZoom={search?.location?.zoom}
                maxZoom={search?.maxZoom}
                minZoom={search?.minZoom}
                radius={search?.calcRadius?.(search?.location?.radius)}
                setLocation={search?.setLocation}
                setZoom={search?.setZoom}
              />
            </div>
          )}
          <div className="m-2 mt-4 flex flex-row">
            <div className="flex grow flex-col items-center">
              <p className="pb-1">Within Countries:</p>
              <select
                id="countries"
                className="max-h-14"
                onChange={(e) => search?.setCountries?.(e)}
                value={search?.countries}
                size={4}
                multiple
              >
                <option value={1}>Canada</option>
                <option value={2}>USA</option>
              </select>
            </div>
            <div className="flex grow flex-col items-center">
              <p className="pb-1">Sort results by:</p>
              <select
                id="sort"
                className="p-1 pl-2"
                onChange={(e) => search?.setSort?.(e)}
                value={search?.sort}
              >
                <option value="0">relevance</option>
                <option value="1">price asc</option>
                <option value="2">price desc</option>
                <option value="3">date asc</option>
                <option value="4">date desc</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomMap = ({
  initialLocation,
  initialZoom,
  maxZoom,
  minZoom,
  radius,
  setLocation,
  setZoom,
}) => {
  const [gjCoordinates, setGJCoordinates] = useState([
    initialLocation?.lon,
    initialLocation?.lat,
  ]);

  const polygon = useMemo(
    () => circleToPolygon(gjCoordinates, radius * 1000),
    [gjCoordinates, radius],
  );

  return (
    <Map
      height={300}
      defaultCenter={[initialLocation?.lat, initialLocation?.lon]}
      defaultZoom={initialZoom}
      metaWheelZoom={true}
      minZoom={minZoom}
      maxZoom={maxZoom}
      onBoundsChanged={({ zoom }) => {
        setZoom?.(zoom);
      }}
      onClick={({ latLng }) => {
        setGJCoordinates(latLng.reverse());
        setLocation?.({ lat: latLng[1], lon: latLng[0] });
      }}
    >
      <GeoJson
        data={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: polygon,
            },
          ],
        }}
        styleCallback={() => {
          return {
            fill: "#234b8f99",
            strokeWidth: "1",
            stroke: "white",
          };
        }}
      />
      <ZoomControl />
    </Map>
  );
};

export const Search = (props) => {
  const search = useSearch(props);
  return <PureSearch {...search} />;
};
