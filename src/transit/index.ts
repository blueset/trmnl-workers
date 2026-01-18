import {
  getTransitArrivalsForStop,
  getTransitStopsForLocation,
  getStopsInfo,
} from "./api";
import type {
  TransitResponse,
  CompassDirection,
  RouteInfo,
  TransitRoute,
  TransitStop,
  TransitApiResponse,
} from "./types";
import {
  calculateDistance,
  calculateBearing,
  getCompassDirection,
  getCombinedDirectionShorthand,
  getRelativeLuminance,
  formatDistance,
  formatTime,
  segmentStopName,
  getDirectionRotation,
} from "./utils";

interface ProcessedArrival {
  stopId: string;
  stopName: string;
  stopCode?: string;
  stopDirection: string;
  stopLat: number;
  stopLon: number;
  tripId: string;
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor?: string;
  routeTextColor?: string;
  destination: string;
  arrivalTimeMs: number;
  isPredicted: boolean;
  distanceToOrigin: number;
  bearingToOrigin: number;
}

interface StopGroup {
  stopName: string;
  stops: Array<{
    stopId: string;
    stopCode?: string;
    stopDirection: string;
    stopLat: number;
    stopLon: number;
    distanceToOrigin: number;
    bearingToOrigin: number;
  }>;
  avgDistance: number;
  avgBearing: number;
  routes: RouteGroup[];
}

interface RouteGroup {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor?: string;
  routeTextColor?: string;
  destination: string;
  stopDirection: string;
  arrivals: Array<{
    tripId: string;
    arrivalTimeMs: number;
    isPredicted: boolean;
  }>;
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Validate required parameters
      const apiKey = url.searchParams.get("key");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing required parameter: key" }, null, 2),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      const latStr = url.searchParams.get("lat");
      const lonStr = url.searchParams.get("lon");
      if (!latStr || !lonStr) {
        return new Response(
          JSON.stringify(
            { error: "Missing required parameters: lat and lon" },
            null,
            2
          ),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (isNaN(lat) || isNaN(lon)) {
        return new Response(
          JSON.stringify({ error: "Invalid lat or lon values" }, null, 2),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Optional parameters
      const stopIdsParam = url.searchParams.get("stopIds");
      const routeIdsParam = url.searchParams.get("routeIds");
      const routeIdsFilter = routeIdsParam
        ? new Set(routeIdsParam.split(",").map((id) => id.trim()))
        : null;
      const radiusStr = url.searchParams.get("radius");
      const radius = radiusStr ? parseInt(radiusStr, 10) : 500;
      const hourCycle =
        (url.searchParams.get("hourCycle") as "h12" | "h23") || "h23";
      const distanceUnit =
        (url.searchParams.get("distanceUnit") as "meter" | "feet") || "meter";

      // Validate hour cycle
      if (hourCycle !== "h12" && hourCycle !== "h23") {
        return new Response(
          JSON.stringify(
            { error: "Invalid hourCycle, must be 'h12' or 'h23'" },
            null,
            2
          ),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Validate distance unit
      if (distanceUnit !== "meter" && distanceUnit !== "feet") {
        return new Response(
          JSON.stringify(
            { error: "Invalid distanceUnit, must be 'meter' or 'feet'" },
            null,
            2
          ),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      let stops: TransitStop[] = [];
      let routes: TransitRoute[] = [];

      // Fetch stops based on parameters
      if (stopIdsParam) {
        // Fetch specific stops
        const stopIds = stopIdsParam.split(",").map((id) => id.trim());
        const stopsData = await getStopsInfo(stopIds, apiKey);
        stops = stopsData.data.list;
        routes = stopsData.data.references.routes;
      } else {
        // Fetch nearby stops
        const locationData = await getTransitStopsForLocation(
          lat,
          lon,
          apiKey,
          radius
        );
        stops = locationData.data.list;
        routes = locationData.data.references.routes;
      }

      if (!stops.length) {
        return new Response(
          JSON.stringify({ stops: [] } as TransitResponse),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Create route lookup map
      const routeMap = new Map(routes.map((route) => [route.id, route]));

      // Fetch arrivals for all stops in parallel
      const arrivalPromises = stops.map(async (stop) => {
        try {
          const data = await getTransitArrivalsForStop(stop.id, apiKey);
          return { stopId: stop.id, data };
        } catch {
          return { stopId: stop.id, data: null };
        }
      });

      const arrivalResults = await Promise.all(arrivalPromises);

      // Create arrivals map
      const arrivalsMap: Record<string, TransitApiResponse> = {};
      for (const { stopId, data } of arrivalResults) {
        if (data) {
          arrivalsMap[stopId] = data;
        }
      }

      // Process all arrivals
      const processedArrivals: ProcessedArrival[] = [];

      for (const stop of stops) {
        const arrivalData = arrivalsMap[stop.id];
        if (!arrivalData?.data?.entry?.arrivalsAndDepartures) continue;

        const arrivals = arrivalData.data.entry.arrivalsAndDepartures;
        const distance = calculateDistance(lat, lon, stop.lat, stop.lon);
        const bearing = calculateBearing(lat, lon, stop.lat, stop.lon);

        // Track best arrival (largest arrivalTimeMs) for each tripId at this stop
        const bestArrivals = new Map<string, ProcessedArrival>();

        for (const arrival of arrivals) {
          const route = routeMap.get(arrival.routeId);
          if (!route) continue;

          // Skip if routeIds filter is specified and this route is not in the filter
          if (routeIdsFilter && !routeIdsFilter.has(arrival.routeId)) continue;

          const arrivalTimeMs =
            arrival.predictedArrivalTime || arrival.scheduledArrivalTime;

          // Skip past arrivals
          if (arrivalTimeMs < Date.now()) continue;

          const processed: ProcessedArrival = {
            stopId: stop.id,
            stopName: stop.name,
            stopCode: stop.code,
            stopDirection: stop.direction || "",
            stopLat: stop.lat,
            stopLon: stop.lon,
            tripId: arrival.tripId,
            routeId: arrival.routeId,
            routeShortName: route.shortName || arrival.routeShortName || route.longName || arrival.routeLongName || "",
            routeLongName: route.longName || arrival.routeLongName || "",
            routeColor: route.color,
            routeTextColor: route.textColor,
            destination: arrival.tripHeadsign,
            arrivalTimeMs,
            isPredicted: !!arrival.predictedArrivalTime,
            distanceToOrigin: distance,
            bearingToOrigin: bearing,
          };

          // Keep the arrival with the largest arrivalTimeMs for each tripId
          const existing = bestArrivals.get(arrival.tripId);
          if (!existing || arrivalTimeMs > existing.arrivalTimeMs) {
            bestArrivals.set(arrival.tripId, processed);
          }
        }

        // Add all best arrivals from this stop to the main list
        processedArrivals.push(...bestArrivals.values());
      }

      // Group by stop name
      const stopNameMap = new Map<string, ProcessedArrival[]>();
      for (const arrival of processedArrivals) {
        const existing = stopNameMap.get(arrival.stopName) || [];
        existing.push(arrival);
        stopNameMap.set(arrival.stopName, existing);
      }

      // Create stop groups
      const groups: StopGroup[] = [];

      for (const [stopName, arrivals] of stopNameMap) {
        // Get unique stops for this stop name
        const uniqueStops = new Map<
          string,
          {
            stopId: string;
            stopCode?: string;
            stopDirection: string;
            stopLat: number;
            stopLon: number;
            distanceToOrigin: number;
            bearingToOrigin: number;
          }
        >();

        for (const arrival of arrivals) {
          if (!uniqueStops.has(arrival.stopId)) {
            uniqueStops.set(arrival.stopId, {
              stopId: arrival.stopId,
              stopCode: arrival.stopCode,
              stopDirection: arrival.stopDirection,
              stopLat: arrival.stopLat,
              stopLon: arrival.stopLon,
              distanceToOrigin: arrival.distanceToOrigin,
              bearingToOrigin: arrival.bearingToOrigin,
            });
          }
        }

        const stopsArray = Array.from(uniqueStops.values());

        // Calculate average distance and bearing
        const avgDistance =
          stopsArray.reduce((sum, s) => sum + s.distanceToOrigin, 0) /
          stopsArray.length;
        const avgBearing =
          stopsArray.reduce((sum, s) => sum + s.bearingToOrigin, 0) /
          stopsArray.length;

        // Group arrivals by route and destination
        const routeDestMap = new Map<string, RouteGroup>();

        for (const arrival of arrivals) {
          const key = `${arrival.routeId}|${arrival.destination}`;
          let routeGroup = routeDestMap.get(key);

          if (!routeGroup) {
            routeGroup = {
              routeId: arrival.routeId,
              routeShortName: arrival.routeShortName,
              routeLongName: arrival.routeLongName,
              routeColor: arrival.routeColor,
              routeTextColor: arrival.routeTextColor,
              destination: arrival.destination,
              stopDirection: arrival.stopDirection,
              arrivals: [],
            };
            routeDestMap.set(key, routeGroup);
          }

          routeGroup.arrivals.push({
            tripId: arrival.tripId,
            arrivalTimeMs: arrival.arrivalTimeMs,
            isPredicted: arrival.isPredicted,
          });
        }

        // Sort arrivals within each route by time
        for (const routeGroup of routeDestMap.values()) {
          routeGroup.arrivals.sort((a, b) => a.arrivalTimeMs - b.arrivalTimeMs);
        }

        // Convert to array and sort by shortName (letters first, then numbers)
        const routesArray = Array.from(routeDestMap.values()).sort((a, b) => {
          const aHasLetter = /[a-zA-Z]/.test(a.routeShortName);
          const bHasLetter = /[a-zA-Z]/.test(b.routeShortName);

          if (aHasLetter && !bHasLetter) return -1;
          if (!aHasLetter && bHasLetter) return 1;

          return a.routeShortName.localeCompare(b.routeShortName, undefined, {
            numeric: true,
          });
        });

        groups.push({
          stopName,
          stops: stopsArray,
          avgDistance,
          avgBearing,
          routes: routesArray,
        });
      }

      // Deduplicate routes: keep each route only in the closest stop group
      const routeToClosestGroup = new Map<
        string,
        { group: StopGroup; distance: number }
      >();

      // Find the closest stop group for each route
      for (const group of groups) {
        for (const route of group.routes) {
          const key = `${route.routeId}|${route.destination}`;
          const existing = routeToClosestGroup.get(key);

          if (!existing || group.avgDistance < existing.distance) {
            routeToClosestGroup.set(key, {
              group,
              distance: group.avgDistance,
            });
          }
        }
      }

      // Remove routes from groups where they're not the closest
      for (const group of groups) {
        group.routes = group.routes.filter((route) => {
          const key = `${route.routeId}|${route.destination}`;
          const closest = routeToClosestGroup.get(key);
          return closest?.group === group;
        });
      }

      // Remove stop groups with no routes
      const groupsWithRoutes = groups.filter((g) => g.routes.length > 0);

      // Sort stop groups by average distance
      groupsWithRoutes.sort((a, b) => a.avgDistance - b.avgDistance);

      // Get all stop names for segmentation
      const allStopNames = groupsWithRoutes.map((g) => g.stopName);

      // Format response
      const response: TransitResponse = {
        stops: groupsWithRoutes.map((group) => {
          // Get unique directions from all stops in this group
          const uniqueDirections = [
            ...new Set(
              group.stops.map((s) => s.stopDirection).filter(Boolean)
            ),
          ];

          // Convert to compass directions
          const compassDirections = uniqueDirections.map((dir) => {
            const bearing = getDirectionRotation(dir);
            return getCompassDirection(bearing);
          });

          // Apply combined direction logic
          const travelDirections: Array<
            CompassDirection | import("./types").CombinedDirectionShorthand
          > =
            compassDirections.length === 2
              ? [getCombinedDirectionShorthand(compassDirections)]
              : compassDirections;

          return {
            name: group.stopName,
            segmentedName: segmentStopName(group.stopName, allStopNames),
            distanceToOrigin: formatDistance(group.avgDistance, distanceUnit),
            bearingToOrigin: getCompassDirection(group.avgBearing),
            stopCodes: group.stops
              .map((s) => s.stopCode)
              .filter((c): c is string => !!c),
            travelDirections,
            routes: group.routes.map((route) => {
              let routeShortName = route.routeShortName;
              let routeShape: "rectangle" | "circle" = "rectangle";
              
              const match = routeShortName.match(/^(.+?)(\sLine)$/i);
              if (match) {
                routeShortName = match[1];
                routeShape = "circle";
              }

              if (!routeShortName.match(/^[0-9]+$/)) {
                // Use initials
                routeShortName = routeShortName
                  .split(/\s+/)
                  .map((word) => word.charAt(0).toUpperCase())
                  .join("");
              }

              // Calculate luminance
              const routeColor = route.routeColor
                ? `#${route.routeColor}`
                : "#666666";
              const routeColorLuminance = getRelativeLuminance(routeColor);

              // Get compass direction for this route
              const routeTravelDirection = getCompassDirection(
                getDirectionRotation(route.stopDirection)
              );

              // Format arrivals
              let lastHour = "";
              const formattedArrivals = route.arrivals.slice(0, 3).map((arr) => {
                const { hour, minute } = formatTime(arr.arrivalTimeMs, hourCycle);
                const arrivalHour = hour === lastHour ? "" : hour;
                lastHour = hour;

                return {
                  arrivalHour,
                  arrivalMinute: minute,
                };
              });

              return {
                routeShortName,
                routeShape,
                routeColor,
                routeColorLuminance,
                routeDestination: route.destination,
                routeTravelDirection,
                arrivals: formattedArrivals,
              };
            }),
          };
        }),
      };

      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (err) {
      console.error("Error processing transit request:", err);
      const message = err instanceof Error ? err.message : "Unknown error";

      // Check if it's an upstream API error (502)
      if (message.includes("Failed to fetch")) {
        return new Response(JSON.stringify({ error: message }, null, 2), {
          status: 502,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      }

      // Otherwise it's a processing error (500)
      return new Response(JSON.stringify({ error: message }, null, 2), {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
  },
};
