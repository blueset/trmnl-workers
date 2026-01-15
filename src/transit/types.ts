// OneBusAway API Response Types
export interface TransitArrival {
  predictedArrivalTime?: number;
  scheduledArrivalTime: number;
  tripHeadsign: string;
  tripId: string;
  routeId: string;
  routeLongName?: string;
  routeShortName?: string;
  tripStatus?: {
    phase: string;
    status: string;
    position: {
      lat: number;
      lon: number;
    };
    orientation: number;
  };
}

export interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  code?: string;
  direction?: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  parent?: string;
}

export interface TransitRoute {
  id: string;
  agencyId: string;
  shortName: string;
  longName: string;
  description: string;
  type: number;
  url: string;
  color: string;
  textColor: string;
  nullSafeShortName: string;
}

export interface TransitApiResponse {
  code?: number;
  currentTime: number;
  data: {
    entry: {
      arrivalsAndDepartures: TransitArrival[];
    };
    references: {
      stops: TransitStop[];
      routes?: TransitRoute[];
    };
  };
}

export interface TransitLocationApiResponse {
  code?: number;
  currentTime: number;
  data: {
    limitExceeded: boolean;
    list: TransitStop[];
    outOfRange: boolean;
    references: {
      routes: TransitRoute[];
      stops: TransitStop[];
    };
  };
}

// Our API Response Types
export type CompassDirection = "↑" | "↗" | "→" | "↘" | "↓" | "↙" | "←" | "↖";
export type CombinedDirectionShorthand =
  | "↕" // North and South
  | "↔" // East and West
  | "⤡" // Northeast and Southwest
  | "⤢"; // Northwest and Southeast

export interface TransitResponse {
  stops: Array<{
    name: string;
    segmentedName: Array<{
      text: string;
      isMuted: boolean;
    }>;
    distanceToOrigin: string; // e.g. "123m" or "456ft"
    bearingToOrigin: CompassDirection;
    stopCodes: string[]; // array of stop codes
    travelDirections: Array<CompassDirection | CombinedDirectionShorthand>; // array of compass directions for each route, with combined direction shorthands applied as applicable
    routes: Array<RouteInfo>;
  }>;
}

export interface RouteInfo {
  routeShortName: string;
  routeShape: "rectangle" | "circle"; // Circle for lines that ends with "Line"
  routeColor: string; // Hex color code
  routeColorLuminance: number; // Luminance value for text color contrast, range [0, 1]
  routeDestination: string;
  routeTravelDirection: CompassDirection;
  arrivals: Array<{
    arrivalHour: string; // formatted hour string based on hourCycle
    arrivalMinute: string; // formatted minute string with leading zero
  }>; // sorted by arrival time ascending
}
