import type {
  TransitApiResponse,
  TransitLocationApiResponse,
  TransitStop,
  TransitRoute,
} from "./types";

const BASE_URL = "https://api.pugetsound.onebusaway.org/api/where";

export async function getTransitArrivalsForStop(
  stopId: string,
  apiKey: string
): Promise<TransitApiResponse> {
  const response = await fetch(
    `${BASE_URL}/arrivals-and-departures-for-stop/${stopId}.json?key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transit data (${response.status})`);
  }

  return (await response.json()) as TransitApiResponse;
}

export async function getTransitStopsForLocation(
  lat: number,
  lon: number,
  apiKey: string,
  radius?: number
): Promise<TransitLocationApiResponse> {
  const params = new URLSearchParams({
    key: apiKey,
    lat: lat.toString(),
    lon: lon.toString(),
  });

  if (radius !== undefined) {
    params.append("radius", radius.toString());
  }

  const response = await fetch(
    `${BASE_URL}/stops-for-location.json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transit data (${response.status})`);
  }

  return (await response.json()) as TransitLocationApiResponse;
}

interface StopApiResponse {
  currentTime: number;
  data: {
    entry: TransitStop;
    references: {
      routes: TransitRoute[];
      stops: TransitStop[];
    };
  };
}

export async function getStopsInfo(
  stopIds: string[],
  apiKey: string
): Promise<TransitLocationApiResponse> {
  // OneBusAway doesn't have a bulk stops endpoint, so we need to fetch them individually
  // and combine the results. However, for simplicity, we'll make parallel requests.
  const promises = stopIds.map(async (stopId) => {
    const response = await fetch(
      `${BASE_URL}/stop/${stopId}.json?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stop ${stopId} (${response.status})`);
    }

    return response.json() as Promise<StopApiResponse>;
  });

  const results = await Promise.all(promises);

  // Combine results into a single response structure
  const stops = results.map((r) => r.data.entry);
  const allRoutes = results.flatMap((r) => r.data.references.routes || []);
  const allReferencedStops = results.flatMap(
    (r) => r.data.references.stops || []
  );

  // Deduplicate routes by id
  const routeMap = new Map<string, TransitRoute>();
  for (const route of allRoutes) {
    routeMap.set(route.id, route);
  }

  // Deduplicate stops by id
  const stopMap = new Map<string, TransitStop>();
  for (const stop of allReferencedStops) {
    stopMap.set(stop.id, stop);
  }

  return {
    currentTime: results[0]?.currentTime || Date.now(),
    data: {
      limitExceeded: false,
      list: stops,
      outOfRange: false,
      references: {
        routes: Array.from(routeMap.values()),
        stops: Array.from(stopMap.values()),
      },
    },
  };
}
