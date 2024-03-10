const earthRadius = 6378137; // equatorial Earth radius

const toRadians = (angleInDegrees) => {
  return (angleInDegrees * Math.PI) / 180;
};

const toDegrees = (angleInRadians) => {
  return (angleInRadians * 180) / Math.PI;
};

const offset = (c1, distance, bearing) => {
  const lat1 = toRadians(c1[1]);
  const lon1 = toRadians(c1[0]);
  const dByR = distance / earthRadius;

  const lat = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing),
  );

  const lon =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat),
    );

  return [toDegrees(lon), toDegrees(lat)];
};

export const circleToPolygon = (center, radius) => {
  const sides = 32;

  const coordinates = [];
  for (let i = 0; i < sides; ++i) {
    coordinates.push(
      offset(
        center,
        radius,
        (2 * Math.PI * -i) / sides,
      ),
    );
  }
  coordinates.push(coordinates[0]);

  return {
    type: "Polygon",
    coordinates: [coordinates],
  };
};
